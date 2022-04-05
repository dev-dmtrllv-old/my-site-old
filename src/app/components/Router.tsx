import { AppContext } from "app/AppContext";
import { AppContextHandler } from "app/AppContextHandler";
import React from "react";
import ReactDOMServer from "react-dom/server";
import * as Path from "utils/path";
import { Async } from "./Async";

export class RouterHandler extends AppContextHandler
{
	private updaterCounter = 0;

	private activeUpdater?: number;

	public readonly appTitle: string;

	private routeListeners: RouteChangeListener[] = [];

	public url: string;
	private _title: string = "";

	public get title() { return this._title ? `${this._title} - ${this.appTitle}` : this.appTitle; }

	public constructor(appContext: AppContext, appTitle: string, url: string = "/") 
	{
		super(appContext);
		this.appTitle = appTitle;
		this.url = url;
		if (env.isClient)
			window.addEventListener("popstate", this.onPopState);
	}

	private onPopState = () => this.setUrl(window.location.pathname, true);

	private _urlUpdater: React.Dispatch<React.SetStateAction<string>> | undefined;

	public setUrl = async (url: string, fromHistory: boolean = false) =>
	{
		const ID = this.updaterCounter++;
		this.activeUpdater = ID;

		const prevURL = this.url;

		const e = { url, prev: prevURL, isLoading: true };

		const isCanceled = () =>
		{
			if (this.activeUpdater !== ID)
			{
				env.isDev && console.warn(`${url} canceled!`);
				return true;
			}
			return false;
		}

		for (const cb of this.routeListeners)
		{
			await cb(e);
			if (isCanceled())
				return;
		}

		url = await this.appContext.prefetch(url);

		if (isCanceled())
			return;

		if (this.url !== url)
		{
			this.url = url;
			if (!fromHistory)
			{
				window.history.pushState(null, "", this.url);
				window.history.replaceState(null, "", url);
				document.title = this.appTitle;
			}
			this._urlUpdater && this._urlUpdater(url);
		}

		e.isLoading = false;

		for (const cb of this.routeListeners)
		{
			await cb(e);
			if (isCanceled())
				return;
		}
	}

	public match(url: string, exact?: boolean, params: { [key: string]: string } = {})
	{
		const tp = this.url.split("/").filter(s => !!s);
		const p = url.split("/").filter(s => !!s);

		if (exact && (tp.length !== p.length))
			return false;
		else if ((!exact) && (tp.length < p.length))
			return false;


		for (let i = 0; i < p.length; i++)
		{
			const s = p[i];
			const ts = tp[i];
			if (s.startsWith(":"))
				params[s.substring(1, s.length)] = ts;
			else if (s !== ts)
				return false;
		}

		return true;
	}

	public back = () => window.history.back();

	public setTitle = (title: string) =>
	{
		this._title = title;
		if (env.isClient)
			document.title = this.title;
	}

	private addChangeListener = (cb: RouteChangeListener) =>
	{
		if (!this.routeListeners.includes(cb))
			this.routeListeners.push(cb);
	}

	private removeOnChangeListeners = (cb: RouteChangeListener) =>
	{
		const i = this.routeListeners.indexOf(cb);
		if (i >= 0)
			this.routeListeners.splice(i, 1);
	}

	public onRouteChange = (cb: RouteChangeListener) =>
	{
		return React.useEffect(() => 
		{
			this.addChangeListener(cb);
			return () => this.removeOnChangeListeners(cb);
		}, [cb]);
	}
}

export const AppRouterContext = React.createContext<{ handler: RouterHandler } | undefined>(undefined);

export const RouterContext = React.createContext<RouterContextType | undefined>(undefined);

export const RouteContext = React.createContext<RouteContextType | undefined>(undefined);

export const AppRouter: React.FC<AppRouterProps> = ({ handler, children }) =>
{
	const [urlState, setUrl] = React.useState(handler.url);

	handler["_urlUpdater"] = setUrl;
	handler.url = urlState;

	return (
		<AppRouterContext.Provider value={{ handler }}>
			{children}
		</AppRouterContext.Provider>
	);
}

export const Router: React.FC<RouterProps> = ({ children, falltrough }) =>
{
	const ctx = React.useContext(AppRouterContext);
	const routerContext = React.useContext(RouterContext);
	const routeContext = React.useContext(RouteContext);

	let url = "/";

	if (routeContext)
		url = routeContext.url;
	else if (routerContext)
		url = routerContext.url;

	if (!ctx?.handler.match(url, false))
		return null;

	return (
		<RouterContext.Provider value={{ url, falltrough: !!falltrough, hasMatched: false }}>
			{children}
		</RouterContext.Provider>
	);
}

export const Route: React.FC<RouteProps> = ({ children, component, path, exact = false }) =>
{
	const ctx = React.useContext(AppRouterContext);
	const routerContext = React.useContext(RouterContext);

	if (!routerContext)
		throw new Error(`Route is not wrapped inside a <Router />!`);

	if (!routerContext.falltrough && routerContext.hasMatched)
		return null;

	const url = Path.join(routerContext.url, path);

	let params = {};

	if (!ctx?.handler.match(url, exact, params))
		return null;
	else
		routerContext.hasMatched = true;

	return (
		<RouteContext.Provider value={{ url, params }}>
			{component ? React.createElement(component, { children }) : children}
		</RouteContext.Provider>
	);
}

export const Page: React.FC<PageProps> = ({ pagePath, path, fallback, exact, prefetch }) =>
{
	return (
		<Route path={path} exact={exact}>
			<Async id={`Page/${pagePath}`} fn={() => import(`../pages/${pagePath}.tsx`)} prefetch={prefetch}>
				{({ isLoading, data, error }) => 
				{
					if (error)
					{
						console.error(error);
						return null;
					}
					else if (isLoading)
					{
						return fallback ? React.createElement(fallback) : null;
					}
					else if (!data.default)
					{
						return null;
					}
					else
					{
						return (
							<data.default />
						);
					}
				}}
			</Async>
		</Route>
	)
}

type PageProps = {
	pagePath: string;
	path: string;
	fallback?: React.FC<any>;
	exact?: boolean;
	prefetch?: boolean;
};


export type RouterProps = {
	falltrough?: boolean;
};

export type RouteProps = {
	path: string;
	exact?: boolean;
	component?: React.FC<any>;
};

export const useRouter = () =>
{
	const ctx = React.useContext(AppRouterContext);
	const routeCtx = React.useContext(RouteContext);

	if (!ctx)
		throw new Error(`Could not get AppRouterContext!`);

	const params = routeCtx?.params || {};

	return {
		routeTo: ctx.handler.setUrl.bind(ctx.handler),
		url: ctx.handler.url,
		match: ctx.handler.match.bind(ctx.handler),
		back: ctx.handler.back.bind(ctx.handler),
		params,
		setTitle: (callbackOrTitle: ((params: RouteParams) => string) | string) =>
		{
			if (env.isServer)
				ctx.handler.setTitle(typeof callbackOrTitle === "function" ? callbackOrTitle(params) : callbackOrTitle);
			React.useEffect(() => 
			{
				const title = typeof callbackOrTitle === "function" ? callbackOrTitle(params) : callbackOrTitle;
				ctx.handler.setTitle(title);

			}, [callbackOrTitle]);
		},
		onRouteChange: ctx.handler.onRouteChange
	};
}

type RouteParams = { [key: string]: string };

type RouteContextType = {
	url: string;
	params: RouteParams;
};

type AppRouterProps = {
	handler: RouterHandler;
};

type RouterContextType = {
	url: string;
	falltrough: Readonly<boolean>;
	hasMatched: boolean;
};

type RouteChangeListener = (event: { url: string, prev: string, isLoading: boolean }) => any;
