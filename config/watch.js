const http = require('http');
const webpack = require("webpack");
const { fork } = require("child_process");
const socket = require("socket.io");

const clientConfig = require("./webpack.client");
const serverConfig = require("./webpack.server");

const { resolve } = require("./paths");


const app = http.createServer((req, res) => { res.statusCode = 500; res.end("NEIN!"); });

const io = socket(app, {
	cors: {
		origin: "http://127.0.0.1:8080",
		methods: ["GET", "POST"]
	}
});


let serverProc = null;

const restartServer = () =>
{
	if (serverProc)
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

		if (children.find(c => c.name === "server")) // restart server
		{
			console.log(`\n[ Restarting Server ]\n`);
			restartServer();
		}

		console.log(`\n[ Reloading Browser ]\n`);
		io.emit("reload");
	}
});

app.listen(8081);
