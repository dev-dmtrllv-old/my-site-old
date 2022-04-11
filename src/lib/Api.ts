import path from "path";
import type { Response, Request } from "express";
import { isSubClass } from "utils";
import http from "http";
import https from "https";

export type CacheType = "default" | "no-store" | "reload" | "no-cache" | "force-cache" | "only-if-cached";

export type ApiInfo = {
	cache?: CacheType;
};

export class Api implements IApi
{
	private static checkAndGetInfo(target: Object, key: string | symbol)
	{
		const ctor = target.constructor as any;

		if (!ctor.info)
			ctor.info = {};

		let t: ApiInfo = ctor.info[key];

		if (!t)
		{
			ctor.info[key] = {};
			t = ctor.info[key];
		}

		return t;
	}

	public static cache(cacheType: CacheType = "default")
	{
		return (target: Object, key: string | symbol, descriptor: PropertyDescriptor) =>
		{
			const info = Api.checkAndGetInfo(target, key);

			info.cache = cacheType;
		}
	}

	private static readonly methodTypes = ["get", "post", "put", "delete"];

	public static createRoutes = <T extends ApiGroup>(apiGroup: T, basePath: string = "/api"): ApiRoutes<T> =>
	{
		const routes: any = {};

		for (const apiPath in apiGroup)
		{
			const p: string = path.join(basePath, apiPath).replace(/\\/g, "/");
			const route: any = apiGroup[apiPath];

			if (isSubClass(route, Api))
				routes[apiPath] = { path: p, type: route };
			else
				routes[apiPath] = Api.createRoutes(route, p);
		}
		return routes;
	}

	public static createManifest(api: FlatApi): string
	{
		const manifest: any = {};
		Object.keys(api).forEach(k => 
		{
			let temp = new api[k](null as any, null as any);
			manifest[k] = {};
			Api.methodTypes.forEach(s => 
			{
				if ((temp as any)[s])
					manifest[k][s] = (api[k] as any).info ? (api[k] as any).info[s] || {} : {};
			});
		});

		return JSON.stringify(manifest);
	}

	public static flatten<T extends ApiRoutes<any>>(routes: T, flatApi: FlatApi = {}): FlatApi
	{
		for (const path in routes)
		{
			const p = routes[path].path;
			if (routes[path].type && isSubClass(routes[path].type, Api) && (typeof p === "string"))
				(flatApi as any)[p] = routes[path].type;
			else
				this.flatten(routes[path] as any, flatApi);
		}
		return flatApi;
	}

	protected readonly req: Request;
	protected readonly res: Response;

	public constructor(req: Request, res: Response)
	{
		this.req = req;
		this.res = res;
	}

	public readonly fetch = (url: string, options?: Omit<http.RequestOptions, "host" | "path"> & { secure?: boolean }) => new Promise<string>((res, rej) => 
	{
		const u = new URL(url);
		const o: http.RequestOptions = {
			host: u.host,
			hostname: u.hostname,
			protocol: u.protocol,
			path: u.pathname,
			...options
		};

		let d = "";

		const target = (options?.secure === undefined || options.secure) ? https : http;

		const req = target.request(o as any, (r) => { r.on("data", data => { d += data }); });
		req.on("error", error => rej(error));
		req.on("close", () => res(d));
		req.end();
	});

	get?(props?: any): any;
	post?(props?: any): any;
	put?(props?: any): any;
	delete?(props?: any): any;
}

export interface IApi
{
	get?(props?: any): any;
	post?(props?: any): any;
	put?(props?: any): any;
	delete?(props?: any): any;
}

export type ApiMethods = keyof IApi;

export type ApiGroup = {
	[path: string]: ApiType<any> | ApiGroup;
};

export type ApiRoutes<T extends ApiGroup> = {
	[K in keyof T]: T[K] extends ApiType<infer A> ? ApiRoute<A>
	: T[K] extends ApiGroup ? ApiRoutes<T[K]>
	: never;
};

export type ApiRoute<T extends Api> = {
	path: string;
	type: ApiType<T>;
};

// export type ApiMethods = "get" | "post" | "put" | "delete";

type ExtractMethods<T extends Api> = Omit<Pick<T, ApiMethods>, OptionalKeys<T>>;

export type ApiType<T extends Api> = new (req: Request, res: Response) => T;
export type ApiMethod<P = undefined, R = any> = (props: P) => R;

export type ClientRoute<T extends Api> = {
	[K in keyof ExtractMethods<T>]: ParseApiMethod<ExtractMethods<T>[K]>
} & { path: string };

type Promisify<T> = T extends Promise<any> ? T : Promise<T>;

type ParseApiMethod<T> = T extends ApiMethod<undefined, infer R> ? () => Promisify<R> : T extends ApiMethod<infer P, infer R> ? (props: P) => Promisify<R> : never;

export type ClientApi<T extends ApiRoutes<any>> = {
	[K in keyof T]: T[K] extends ApiRoute<infer A> ? ClientRoute<A>
	: T[K] extends ApiRoutes<any> ? ClientApi<T[K]>
	: never;
};

export type FlatApi = {
	[key: string]: ApiType<Api>;
};
