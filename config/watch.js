const clientConfig = require("./webpack.client");
const serverConfig = require("./webpack.server");

const webpack = require("webpack");

const { fork } = require("child_process");
const { resolve } = require("./paths");

let serverProc = null;

const restartServer = () =>
{
	if(serverProc)
		serverProc.kill();

	serverProc = fork("main.bundle.js", { cwd: resolve("dist"), stdio: "inherit" });
}

webpack([clientConfig(), serverConfig()]).watch({}, (err, compilation) => 
{
	if (err)
	{
		console.log(err);
	}
	else
	{
		compilation.stats.forEach(s => console.log(s.toString("minimal") + "\n"));

		const children = compilation.toJson("minimal").children;
		if(children.find(c => c.name === "server")) // restart server
		{
			console.log(`\n[ Restarting Server ]\n`);
			restartServer();
		}
		else if(children.find(c => c.name === "app")) // reload app
		{
			console.log(`\n[ Reloading Browser ]\n`)
		}
	}
});

