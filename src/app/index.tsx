import { createRoot } from "react-dom/client";
import React from "react";
import { App } from "./App";
import { AppContext } from "./AppContext";

import "./index.scss";

const rootElement = document.getElementById("root");

if (!rootElement)
	throw new Error();

const appContext = AppContext.createClientContext(App);

let url = window.location.pathname;

url = await appContext.prefetch(url);

appContext.routerHandler.updateUrlFromRedirect(url);

createRoot(rootElement).render(<appContext.Context><App /></appContext.Context>);
