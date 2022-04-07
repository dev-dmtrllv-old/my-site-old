import express, { Express, NextFunction, Request, Response } from "express";
import { Renderer } from "./Renderer";
import session from "express-session";
import { Manifest } from "./Manifest";

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
	public readonly manifest: Manifest;

	private constructor(config: ServerConfig)
	{
		this.config = config;
		this.manifest = new Manifest();
		this.express = express();
		const ses = {
			secret: "keyboard cat",
			resave: true,
			saveUninitialized: true,
			cookie: { secure: false }
		};

		if (!env.isDev)
		{
			this.express.set('trust proxy', 1) // trust first proxy
			ses.cookie.secure = true // serve secure cookies
		}

		this.express.use(session(ses));

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
		if (req.session.redirectUrls?.includes(req.url))
		{
			const msg = `Redirect cycle detected! ${req.session.redirectUrls.join(" -> ")} -> ${req.url}`;
			req.session.redirectUrls = [];
			res.send(msg);
		}
		else
		{
			const renderer = new Renderer(this, req, res, "My Site");

			const html = await renderer.render((url) => 
			{
				if (!req.session.redirectUrls)
					req.session.redirectUrls = [req.url];
				else
					req.session.redirectUrls.push(req.url);
				
				res.redirect(url);
			});

			if (html)
			{
				req.session.redirectUrls = [];
				res.send(html);
			}
		}
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
