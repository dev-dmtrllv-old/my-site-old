import express, { Express, NextFunction, Request, Response } from "express";
import { Renderer } from "./Renderer";

export class Server
{
	private static instance: Server | null = null;
	
	public static get(): Server
	{
		if (!this.instance)
		throw new Error(`Server is not initialized yet!`);
		return this.instance;
	}
	
	public static async init(config: ServerConfig): Promise<Server>
	{
		if (this.instance)
		throw new Error(`Server is already initialized!`);
		this.instance = new Server(config);
		await this.instance.onLoad();
		return this.instance;
	}
	
	public readonly config: ServerConfig;
	public readonly express: Express;


	private constructor(config: ServerConfig)
	{
		this.config = config;
		this.express = express();

		this.express.use(express.static("app"));
		this.express.all("/api", this.onApi);
		this.express.get("*", this.onRender);
	}

	public async onLoad()
	{
		
	}

	private readonly onApi = (req: Request, res: Response, next: NextFunction) =>
	{
		next();
	}

	private readonly onRender = async (req: Request, res: Response) =>
	{
		const renderer = new Renderer(this, req.url, "My Site");

		res.send(await renderer.render());
	}

	public start()
	{
		const { port, host } = this.config;
		this.express.listen(port, host, () => 
		{
			console.log(`Server is listening on http${env.isDev ? "" : "s"}://${host}:${port}`);
		});
	}
}

type ServerConfig = {
	host: string;
	port: number;
};
