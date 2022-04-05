import { exec } from "utils";
import { Server } from "./Server";

exec(async () => 
{
	const server = await Server.init({
		host: "127.0.0.1",
		port: 8080
	});

	server.start();
});
