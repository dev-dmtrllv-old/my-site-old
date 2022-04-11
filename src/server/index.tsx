import { Server, ServerConfig } from "lib/Server";
import { apiRoutes } from "./api";

const server = await Server.init(class extends Server
{
	protected onConfigure(config: ServerConfig): void
	{
		config.api = apiRoutes;
		config.session.secret = "Some Secrets";
	}
});

server.start();
