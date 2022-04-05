import type { AppContext } from "./AppContext";

export abstract class AppContextHandler
{
	public readonly appContext: AppContext;

	public constructor(appContext: AppContext)
	{
		this.appContext = appContext;
	}
}
