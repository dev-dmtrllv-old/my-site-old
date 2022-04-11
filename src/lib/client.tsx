import { hydrateRoot } from "react-dom/client";
import React from "react";
import { exec } from "utils";
import { serialize } from "utils/object";
import type { ClientApiType } from "server/api";
import type { ApiInfo } from "./Api";
import { AppContext } from "./AppContext";

export const render = async (App: React.FC<any>) =>
{
	if (env.isDev)
		(await import("socket.io-client")).io("http://localhost:8081").on("reload", () => window.location.reload());

	let rootElement = document.getElementById("root");

	if (!rootElement)
	{
		rootElement = document.createElement("div");
		document.body.appendChild(rootElement);
		rootElement.id = "root";
	}

	const appContext = AppContext.createClientContext(App);

	let url = window.location.pathname;

	url = await appContext.prefetch(url);

	appContext.routerHandler.updateUrlFromRedirect(url);

	hydrateRoot(rootElement, <appContext.Context><App /></appContext.Context>);
}


const createGetMethod = (url: string, info: ApiInfo) =>
{
	return async (data: any = {}) => 
	{
		return await fetch(url + `?` + serialize(data), {
			method: "GET",
			mode: "cors",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			},
			redirect: "follow",
			referrerPolicy: "no-referrer",
			body: JSON.stringify(data),
			...info
		}).then(res => res.text()).then(s => 
		{
			const r = JSON.parse(s);
			if (r.data)
				return r.data;
			else if (r.error)
				throw r.error;
		});
	}
}

const createPostMethod = (url: string, method: "POST" | "PUT" | "DELETE" = "POST", info: ApiInfo) =>
{
	return async (data: any = {}) => 
	{
		const r = await fetch(url, {
			method: method,
			mode: "cors",
			cache: "no-cache",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json"
			},
			redirect: "follow",
			referrerPolicy: "no-referrer",
			body: JSON.stringify(data),
			...info
		});

		const str = await r.text();

		const response = JSON.parse(str);

		if (response.data)
			return response.data;
		else if (response.error)
			throw response.error;
	};
}

export const api: ClientApiType = exec(() => 
{
	let apiObj: any = {};

	const manifest = JSON.parse(window.__SERVER_DATA__.api);

	Object.keys(manifest).forEach(k => 
	{
		let target = apiObj;

		const [, ...parts] = k.split("/");

		parts.forEach((p, i) => 
		{
			if (i < parts.length)
			{
				if (!target[p])
					target[p] = {};
				target = target[p];
			}
		});

		Object.keys(manifest[k]).forEach(m => 
		{
			if (!target[m])
			{
				if (m === "get")
					target[m] = createGetMethod(k, manifest[k][m].info);
				else
					target[m] = createPostMethod(k, m as any, manifest[k][m].info);
			}
		});
	});
	
	return apiObj.api;
});
