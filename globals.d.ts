import type { AsyncClientCache } from "lib/Async";

declare module '*.scss' {
	const style: string;
	export default style;
}

declare global
{
	declare type Environment = {
		isDev: boolean;
		isServer: boolean;
		isClient: boolean;
	};

	declare type ServerData = {
		async: AsyncClientCache;
		appTitle: string;
		api: string;
	};

	interface Window
	{
		__SERVER_DATA__: ServerData;
	}

	declare type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];
	declare type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];

	declare type ObjectMap<T = any> = { [key: string]: T };
	declare type Transform<T, Type> = { [P in keyof T]: Type };
	declare type Nullable<T> = T | null;
	declare type NullableMap<T> = { [P in keyof T]: T[P] | null };
	declare type OptionalMap<T> = { [P in keyof T]?: T[P] };
	declare type ReactProps<T extends HTMLElement> = Omit<React.DetailedHTMLProps<React.HTMLAttributes<T>, T>, "ref">;

	declare const env: Environment;
}

declare module "express-session"
{
    interface SessionData {
		redirectUrls?: string[];
    }
}
