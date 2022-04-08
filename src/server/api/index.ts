import { Api, ClientApi } from "./Api";
import { Test } from "./Test";

export const apiRoutes = Api.createRoutes({
	test: Test,
	wop: {
		wip: {
			test: Test
		}
	}
});

export type ClientApiType = ClientApi<typeof apiRoutes>;

export { Api };
