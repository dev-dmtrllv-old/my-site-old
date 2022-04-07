import React from "react";
import { wait } from "utils";
import { Dynamic } from "./components/Dynamic";
import { Page, Redirect, Router, useRouter } from "./components/Router";

export const App = () =>
{
	const [state, setIsLoading] = React.useState<{ from: string, to: string } | null>(null);

	const { routeTo, onRouteChange } = useRouter();

	onRouteChange(async e => 
	{
		setIsLoading(e.isLoading ? { from: e.prev, to: e.url } : null);
		if (e.isLoading)
			await wait(1500);
	});

	return (
		<Router falltrough={true}>
			<button onClick={() => routeTo("/")}>Test /</button>
			<button onClick={() => routeTo("/home")}>HOME</button>
			<button onClick={() => routeTo("/cv")}>CV</button>

			<Page exact path="/home" pagePath="home" prefetch />
			<Page exact path="/cv" pagePath="cv" prefetch />

			<Redirect exact from="/" to="/home" />

			<Dynamic path="./pages/test" importer={() => import(`./pages/test`)} prefetch/>
			
			<div>hi</div>

			{state && (
				<>
					<h1>Loading url {state.to}</h1>
					<span>(from: {state?.from})</span>
				</>
			)}
		</Router>
	);
}
