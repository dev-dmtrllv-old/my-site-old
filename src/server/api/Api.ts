import path from "path";
import type { Response, Request } from "express";
import { isSubClass } from "utils";

export class Api
{
	public static readonly methodTypes = ["get", "post", "put", "delete"];

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
			manifest[k] = Object.keys(temp).filter(s => this.methodTypes.includes(s));
		});

		return JSON.stringify(manifest);
	}

	public static createClientApi<T extends ApiRoutes<any>>(): ClientApi<T>
	{
		console.log(window.__SERVER_DATA__.api);
		return null as unknown as ClientApi<T>;
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

	public get?: (props?: any) => any;
	public post?: (props?: any) => any;
	public put?: (props?: any) => any;
	public delete?: (props?: any) => any;
}

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

export type ApiMethods = "get" | "post" | "put" | "delete";

type ExtractMethods<T extends Api> = Omit<Pick<T, ApiMethods>, OptionalKeys<T>>;

export type ApiType<T extends Api> = new (req: Request, res: Response) => T;
export type ApiMethod<P = undefined, R = any> = (props: P) => R;

type ExtractPromise<T> = T extends Promise<infer P> ? P : T;

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
