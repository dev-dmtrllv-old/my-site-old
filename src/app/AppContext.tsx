import React from "react";
import ReactDOMServer from "react-dom/server";
import { AsyncClientCache, AsyncContext, AsyncHandler } from "./components/Async";
import { AppRouter, RouterHandler } from "./components/Router";

export class AppContext
{
	public readonly app: React.FC<any>;
	public readonly asyncHandler: AsyncHandler;
	public readonly routerHandler: RouterHandler;

	public static createServerContext(app: React.FC<any>, appTitle: string, url: string, asyncCache: AsyncClientCache = {})
	{
		return new AppContext(app, appTitle, url, asyncCache, true);
	}

	public static createClientContext(app: React.FC<any>)
	{
		return new AppContext(app, window.__SERVER_DATA__.appTitle, window.location.pathname, window.__SERVER_DATA__.async);
	}

	private constructor(app: React.FC<any>, appTitle: string, url: string, asyncCache: AsyncClientCache = {}, isPrefetching: boolean = env.isServer) 
	{
		this.app = app;
		this.asyncHandler = new AsyncHandler(this, asyncCache, isPrefetching);
		this.routerHandler = new RouterHandler(this, appTitle, url);
	}

	public readonly Context: React.FC = ({ children }) =>
	{
		return (
			<AsyncContext.Provider value={this.asyncHandler} >
				<AppRouter handler={this.routerHandler}>
					{children}
				</AppRouter>
			</AsyncContext.Provider>
		);
	}

	public readonly prefetch = async (url: string, onPrefetch: () => any = () => {}, ctx: AppContext = AppContext.createServerContext(this.app, this.routerHandler.appTitle, url, this.asyncHandler.cache)) =>
	{
		ReactDOMServer.renderToStaticMarkup(
			<ctx.Context>
				<ctx.app />
			</ctx.Context>
		);

		if (ctx.asyncHandler.toResolveCount > 0)
		{
			await onPrefetch();
			await ctx.asyncHandler.resolveAll();
			await this.prefetch(url, onPrefetch, ctx);
		}
		else
		{
			this.asyncHandler.update(ctx.asyncHandler.cache);
		}

		return url;
	}
}
