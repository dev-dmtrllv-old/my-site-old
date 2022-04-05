import React from "react";
import { wait } from "utils";
import { Page, Router, useRouter } from "./components/Router";

export const App = () =>
{
	const [state, setIsLoading] = React.useState<{ from: string, to: string } | null>(null);

	const { routeTo, onRouteChange } = useRouter();

	onRouteChange(async e => 
	{
		setIsLoading(e.isLoading ? { from: e.prev, to: e.url } : null);
		if (e.isLoading)
			await wait(800);
	});

	return (
		<Router falltrough={true}>
			<button onClick={() => routeTo("/")}>HOME</button>
			<button onClick={() => routeTo("/cv")}>CV</button>

			<Page exact path="/" pagePath="home" prefetch />
			<Page exact path="/cv" pagePath="cv" prefetch />

			{state && (
				<>
					<h1>Loading url {state.to}</h1>
					<span>(from: {state?.from})</span>
				</>
			)}
		</Router>
	);
}
