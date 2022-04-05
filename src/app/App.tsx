import React from "react";
import { Page, Router, useRouter } from "./components/Router";

export const App = () =>
{
	const [isLoading, setIsLoading] = React.useState(false);

	const { routeTo, onRouteChange } = useRouter();

	onRouteChange(e => setIsLoading(e.isLoading));

	return (
		<Router falltrough={true}>
			<button onClick={() => routeTo("/")}>HOME</button>
			<button onClick={() => routeTo("/cv")}>CV</button>

			<Page exact path="/" pagePath="home" prefetch />
			<Page exact path="/cv" pagePath="cv" prefetch/>
			
			<h1>{isLoading && "LOADING..."}</h1>
		</Router>
	);
}
