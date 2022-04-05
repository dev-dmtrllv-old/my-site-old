import React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";

import { App } from "app/App";

import type { Server } from "./Server";
import { AppContext } from "app/AppContext";

const HtmlComponent: HtmlFC = ({ title, app, serverData }) =>
{
	const serverDataScript = `window.__SERVER_DATA__ = ${JSON.stringify(serverData)}; document.getElementById("__SERVER_DATA__").remove();`;
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<title>{title}</title>
				<link href="/css/main.bundle.css" rel="stylesheet" />
				<link rel="icon" href="data:;base64,iVBORw0KGgo=" />
			</head>
			<body cz-shortcut-listen="true">
				<div id="root" dangerouslySetInnerHTML={{ __html: app }}></div>
				<script src="/js/runtime.bundle.js"></script>
				<script src="/js/vendors.bundle.js"></script>
				<script id="__SERVER_DATA__" dangerouslySetInnerHTML={{ __html: serverDataScript }}></script>
				<script src="/js/main.bundle.js"></script>
			</body>
		</html>
	);
}

export class Renderer
{
	public readonly server: Server;
	public readonly appContext: AppContext;

	private readonly Html: HtmlFC;

	public constructor(server: Server, path: string, title: string, htmlComponent: HtmlFC = HtmlComponent)
	{
		this.server = server;
		this.appContext = AppContext.createServerContext(App, title, path);
		this.Html = htmlComponent;
	}

	private async prefetch()
	{
		renderToStaticMarkup(
			<this.appContext.Context>
				<App />
			</this.appContext.Context>
		);

		if (this.appContext.asyncHandler.toResolveCount > 0)
		{
			await this.appContext.asyncHandler.resolveAll();
			await this.prefetch();
		}
	}

	public async render()
	{
		await this.prefetch();

		const serverData: ServerData = {
			async: this.appContext.asyncHandler.cache,
			appTitle: this.appContext.routerHandler.appTitle
		};

		const app = renderToString(
			<this.appContext.Context>
				<App />
			</this.appContext.Context>
		);

		return `<!DOCTYPE html>${renderToStaticMarkup(<this.Html app={app} title={this.appContext.routerHandler.title} serverData={serverData} />)}`;
	}
}

export type HtmlFC = React.FC<HtmlProps>;

export type HtmlProps = {
	title: string;
	app: string;
	serverData: ServerData;
};
