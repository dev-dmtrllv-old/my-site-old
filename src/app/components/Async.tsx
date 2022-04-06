import type { AppContext } from "app/AppContext";
import { AppContextHandler } from "app/AppContextHandler";
import React from "react";

export class AsyncHandler extends AppContextHandler
{
	public isPrefetching: boolean;

	private _toResolve: AsyncCacheState[] = [];

	public get toResolveCount() { return this._toResolve.length; }

	private _cache: AsyncCache = {};

	public get cache()
	{
		const c: AsyncClientCache = {};

		for (const key in this._cache)
		{
			if (!env.isServer && !key.startsWith("Page"))
			{
				const { fn, ...rest } = this._cache[key];
				if (!rest.state.isLoading)
				{
					c[key] = rest;
				}
			}
		}

		return c;
	}

	public get(id: string)
	{
		if (this._cache[id])
			return this._cache[id].state;
		return {
			isLoading: true
		}
	}

	public clearResolvers = () =>
	{
		this._toResolve = [];
	}

	public constructor(appContext: AppContext, cache: AsyncClientCache = {}, isPrefetching = false)
	{
		super(appContext);
		this.isPrefetching = isPrefetching;
		this._cache = { ...cache as any };
	}

	public update = (cache: AsyncClientCache) => this._cache = { ...this._cache, ...cache as any }

	public prefetch = (id: string, props: any, fn: AsyncFn<any, any>) =>
	{
		if (this._cache[id])
			return this._cache[id].state;

		if (this.isPrefetching)
		{
			if (!this._cache[id])
			{
				this._cache[id] = {
					props,
					state: {
						isLoading: true
					},
					id,
					fn
				};
				this._toResolve.push(this._cache[id]);
			}
			return this._cache[id].state;
		}

		return {
			isLoading: true
		};
	}

	public resolveAll = async () =>
	{
		for (const { id, fn, props } of this._toResolve)
			await this.resolve(id, props, fn);

		this._toResolve = [];
	}

	public resolve = async (id: string, props: any, fn: AsyncFn<any, any>, stateDispatcher: React.Dispatch<React.SetStateAction<AsyncState<any>>> = () => { }) =>
	{
		if (env.isServer || this.isPrefetching || !this._cache[id])
		{
			let data;
			let error;
			try
			{
				data = await fn(props);
			}
			catch (err)
			{
				error = (err as Error).message;
			}

			const state = { isLoading: false, data };

			this._cache[id] = { fn, id, props, state };

			stateDispatcher(state);
		}
		else
		{
			stateDispatcher({ isLoading: true });
		}
	}
}

export const AsyncContext = React.createContext<AsyncHandler | undefined>(undefined);

export const Async = <Data extends any>({ id, fn, prefetch, children }: AsyncProps<{}, Data>) =>
{
	const state = useAsyncState<{}, Data>(`Async/${id}`, { fn, props: {}, prefetch });

	return children(state);
};

export const useAsyncState = <P extends any, Data extends any>(id: string, { props, fn, dependencies = [], prefetch }: AsyncOptions<P, Data>): AsyncState<Data> =>
{
	const ctx = React.useContext(AsyncContext);

	if (!ctx)
		throw new Error(`Not wrapped by an async context!`);

	const ID = React.useRef(id);

	const [state, setState] = React.useState<AsyncState<Data>>(prefetch ? ctx.prefetch(ID.current, props, fn) : ctx.get(ID.current));

	React.useEffect(() => 
	{
		if (id !== ID.current)
		{
			ID.current = id;
			ctx.resolve(ID.current, props, fn, setState);
		}
		else if (state.isLoading && !ctx.isPrefetching)
		{
			ctx.resolve(ID.current, props, fn, setState);
		}

		return () => { };
	}, [...dependencies, id]);

	return state;
}

export type AsyncFn<P extends any, Data extends any> = (props: P) => Data | Promise<Data>;

export type AsyncState<Data extends any> = {
	isLoading?: false;
	data?: Data;
	error?: string;
} | {
	isLoading?: true;
	data?: never;
	error?: never;
};

type AsyncCacheState = {
	props: any;
	state: AsyncState<any>;
	fn: AsyncFn<any, any>;
	id: string;
};

export type AsyncCache = { [id: string]: AsyncCacheState };
export type AsyncClientCache = { [id: string]: Omit<AsyncCacheState, "fn"> }

export type AsyncOptions<P extends any, Data extends any> = {
	prefetch?: boolean;
	props: P;
	fn: AsyncFn<P, Data>;
	dependencies?: ReadonlyArray<any>
};

type AsyncProps<P extends any, Data extends any> = {
	prefetch?: boolean;
	fn: AsyncFn<P, Data>;
	children: (state: AsyncState<Data>) => any;
	id: string;
};
