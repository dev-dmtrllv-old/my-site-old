import { hydrateRoot } from "react-dom/client";
import React from "react";
import { App } from "./App";
import { AppContext } from "./AppContext";
import { api } from "./api";

import "./index.scss";

const rootElement = document.getElementById("root");

if (!rootElement)
	throw new Error();

const appContext = AppContext.createClientContext(App);

let url = window.location.pathname;

url = await appContext.prefetch(url);

appContext.routerHandler.updateUrlFromRedirect(url);

hydrateRoot(rootElement, <appContext.Context><App /></appContext.Context>);

let a = await api.test.get();

console.log(a.wop)

if (env.isDev)
	(await import("socket.io-client")).io("http://localhost:8081").on("reload", () => window.location.reload())
