import { AppContext } from "app/AppContext";
import { AppContextHandler } from "app/AppContextHandler";
import React from "react";
import * as Path from "utils/path";
import { Dynamic } from "./Dynamic";

export class RouterHandler extends AppContextHandler
{
	private updaterCounter = 0;

	private activeUpdater?: number;

	public readonly appTitle: string;

	private routeListeners: RouteChangeListener[] = [];

	public url: string;
	private _title: string = "";

	public redirectInfo: RedirectProps | null = null;

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

	public updateUrlFromRedirect = (url: string) =>
	{
		this.url = url;
		this.redirectInfo = null;
		if (env.isClient)
			this.appContext.asyncHandler.clearResolvers();
	}

	public setUrl = async (url: string, fromHistory: boolean = false, ID: number = this.updaterCounter++) =>
	{
		const e: RouteEvent = { url, prev: this.url, isLoading: true, isCanceled: false };

		if (this.activeUpdater !== undefined && url === this.url)
		{
			this.activeUpdater = undefined;

			e.isLoading = false;
			e.isCanceled = true;

			for (const cb of this.routeListeners)
				await cb(e);

			return;
		}

		this.activeUpdater = ID;

		if (this.url !== url)
		{
			const isCanceled = () => this.activeUpdater !== ID;

			try
			{
				let didPrefetch = false;

				if (isCanceled())
				{
					this.activeUpdater = undefined;
					return;
				}

				const redirectURL = await this.appContext.prefetch(url, async (url) => 
				{
					if ((url !== this.url) && !didPrefetch && !isCanceled())
					{
						didPrefetch = true;
						e.isLoading = true;
						for (const cb of this.routeListeners)
							await cb(e);
					}

					return !isCanceled();
				});

				if (url != redirectURL)
				{
					await this.setUrl(redirectURL, fromHistory, ID);
				}
				else
				{
					if (isCanceled())
					{
						this.activeUpdater = undefined;
						return;
					}

					url = redirectURL;

					if (!fromHistory)
					{
						window.history.pushState(null, "", this.url);
						window.history.replaceState(null, "", url);
						document.title = this.appTitle;
					}

					this.url = url;

					this._urlUpdater && this._urlUpdater(url);

					e.isLoading = false;

					for (const cb of this.routeListeners)
						await cb(e);
				}

				this.activeUpdater = undefined;
			}
			catch (err)
			{
				this.activeUpdater = undefined;
				e.isLoading = false;
				e.isCanceled = true;

				for (const cb of this.routeListeners)
					await cb(e);

				console.warn(err);
			}
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

	public onRedirect = (from: string, to: string, exact?: boolean) =>
	{
		if (this.appContext.asyncHandler.isPrefetching && this.match(from, exact))
		{
			this.redirectInfo = { from, to, exact };
		}

		return React.useEffect(() => 
		{
			if (this.match(from, exact))
				this.setUrl(to);
		}, [from, to, exact]);
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

export const Page: React.FC<PageProps> = ({ pagePath, path, fallback, exact, prefetch, onLoad }) =>
{
	return (
		<Route path={path} exact={exact}>
			<Dynamic importer={() => import(`../pages/${pagePath}.tsx`)} prefetch={prefetch} path={`/${pagePath}`} fallback={fallback} load={onLoad} />
		</Route>
	);
}

export const Redirect: React.FC<RedirectProps> = ({ from, to, exact }) =>
{
	const routerCtx = React.useContext(AppRouterContext);

	if (!routerCtx)
		throw new Error(``);

	routerCtx.handler.onRedirect(from, to, exact);

	return null;
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

type PageProps = {
	pagePath: string;
	path: string;
	fallback?: React.FC<any>;
	onLoad?: React.FC<any>;
	exact?: boolean;
	prefetch?: boolean;
};

type RouterProps = {
	falltrough?: boolean;
};

type RouteProps = {
	path: string;
	exact?: boolean;
	component?: React.FC<any>;
};

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

type RouteEvent = { url: string, prev: string, isLoading: boolean, isCanceled: boolean };

type RouteChangeListener = (event: Readonly<RouteEvent>) => any;

type RedirectProps = {
	from: string;
	to: string;
	exact?: boolean;
};
