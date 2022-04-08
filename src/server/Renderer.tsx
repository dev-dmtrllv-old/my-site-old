import React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";

import { App } from "app/App";

import type { Server } from "./Server";
import { AppContext } from "app/AppContext";
import { Request, Response } from "express";
import { DYNAMIC_KEY } from "app/components/Dynamic";

const HtmlComponent: HtmlFC = ({ title, app, serverData, scripts, styles }) =>
{
	const serverDataScript = `window.__SERVER_DATA__ = ${JSON.stringify(serverData)}; document.getElementById("__SERVER_DATA__").remove();`;
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<title>{title}</title>
				{styles.map((s, k) => <link href={s} key={k} rel="stylesheet" />)}
				<link rel="icon" href="data:;base64,iVBORw0KGgo=" />
			</head>
			<body cz-shortcut-listen="true">
				<div id="root" dangerouslySetInnerHTML={{ __html: app }}></div>
				<script id="__SERVER_DATA__" dangerouslySetInnerHTML={{ __html: serverDataScript }}></script>
				{scripts.map((s, k) => <script key={k} src={s} />)}
			</body>
		</html>
	);
}

export class Renderer
{
	public readonly server: Server;
	public readonly appContext: AppContext;

	private readonly Html: HtmlFC;

	private readonly req: Request;
	private readonly res: Response<any, Record<string, any>>;

	public constructor(server: Server, req: Request, res: Response, title: string, htmlComponent: HtmlFC = HtmlComponent)
	{
		this.server = server;
		this.req = req;
		this.res = res;
		this.appContext = AppContext.createServerContext(App, title, req.url);
		this.Html = htmlComponent;
	}

	private async prefetch(onRedirect: (url: string) => void = () => { }): Promise<any>
	{
		renderToStaticMarkup(
			<this.appContext.Context>
				<App />
			</this.appContext.Context>
		);

		const r = this.appContext.routerHandler.redirectInfo as any;

		if (r)
		{
			onRedirect(r.to);
		}
		else if (this.appContext.asyncHandler.toResolveCount > 0)
		{
			await this.appContext.asyncHandler.resolveAll();
			await this.prefetch();
		}
	}

	public async render(onRedirect: (url: string) => void = () => { })
	{
		let didRedirect = false;

		await this.prefetch((url) => 
		{
			didRedirect = true;
			onRedirect(url);
		});

		if (didRedirect)
			return null;


		const c = this.appContext.asyncHandler.cache;

		const dynamicImports: string[] = [];

		Object.keys(c).forEach(s => 
		{
			if (s.startsWith(DYNAMIC_KEY))
			{

				let p = s.replace(DYNAMIC_KEY, "");

				if (p.startsWith("/"))
					p = "." + p;
				else if (!p.startsWith("."))
					p = "./" + p;

				dynamicImports.push(s);
				delete c[s];
			}
		});

		const serverData: ServerData = {
			async: c,
			appTitle: this.appContext.routerHandler.appTitle,
			api: this.server.clientApiManifest
		};

		this.appContext.isPrefetching = false;

		const app = renderToString(
			<this.appContext.Context>
				<App />
			</this.appContext.Context>
		);

		const scripts = this.server.manifest.get(dynamicImports, "js");
		const styles = this.server.manifest.get(dynamicImports, "css");

		return `<!DOCTYPE html>${renderToStaticMarkup(<this.Html app={app} title={this.appContext.routerHandler.title} serverData={serverData} scripts={scripts} styles={styles} />)}`;
	}
}

export type HtmlFC = React.FC<HtmlProps>;

export type HtmlProps = {
	title: string;
	app: string;
	serverData: ServerData;
	scripts: string[];
	styles: string[];
};
