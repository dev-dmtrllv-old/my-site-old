import React from "react";
import { useAsyncState } from "./Async";

const isFC = (fc: any) =>
{
	const c = fc.toString();
	return typeof fc === "function" && (c.includes("react__WEBPACK_IMPORTED_MODULE_0___default().createElement"))
}

const getComponentFromModule = (mod: any, exportName?: string) =>
{
	if (exportName)
		return mod[exportName];

	if (mod.default)
		return mod.default;

	const f = Object.keys(mod).find(e => isFC(mod[e]));

	return f ? mod[f] : null;
}

const renderOptional = (Component?: React.FC<any>) => Component ? <Component /> : null;

export const DYNAMIC_KEY = "Dynamic";

export const Dynamic: React.FC<DynamicProps> = ({ path, fallback, load, importer, prefetch, exportName }) =>
{
	const key = (path.startsWith("./") || path.startsWith(".") || path.startsWith("/")) ? path : `/${path}`;
	
	const state = useAsyncState(`${DYNAMIC_KEY}${key}`, {
		fn: importer,
		props: { path },
		dependencies: [path],
		prefetch
	});
	
	if (state.isLoading)
		return renderOptional(load);
	else if (state.data)
		return renderOptional(getComponentFromModule(state.data, exportName));
	else if (state.error)
		return renderOptional(fallback);
	else
		return renderOptional(load);
}

export type DynamicProps = {
	path: string;
	fallback?: React.FC<any>;
	load?: React.FC<any>;
	importer: () => Promise<any>;
	prefetch?: boolean;
	exportName?: string;
};
