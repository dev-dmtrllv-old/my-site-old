import React from "react";
import { wait } from "utils";
import { Dynamic } from "./components/Dynamic";
import { Link, Page, Redirect, Router, useRouter } from "./components/Router";

export const App = () =>
{
	const [state, setIsLoading] = React.useState<{ from: string, to: string } | null>(null);

	const { onRouteChange } = useRouter();

	onRouteChange(async e => 
	{
		setIsLoading(e.isLoading ? { from: e.prev, to: e.url } : null);
		if (e.isLoading)
			await wait(1500);
	});

	return (
		<Router falltrough={true}>
			<Link to="/" exact>/</Link>
			<br/>
			<Link to="/home" exact>/home</Link>
			<br/>
			<Link to="/cv" exact>/cv</Link>

			<Page exact path="/home" pagePath="home" prefetch />
			<Page exact path="/cv" pagePath="cv" prefetch />

			<Redirect exact from="/" to="/home" />

			<Dynamic path="./pages/test" importer={() => import(`./pages/test`)} prefetch/>
			
			{state && (
				<>
					<h1>Loading url {state.to}</h1>
					<span>(from: {state?.from})</span>
				</>
			)}
		</Router>
	);
}
