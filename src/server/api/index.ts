import { Api, ClientApi } from "lib/Api";
import { Users } from "./Users";

export const apiRoutes = Api.createRoutes({
	users: Users
});

export type ClientApiType = ClientApi<typeof apiRoutes>;
