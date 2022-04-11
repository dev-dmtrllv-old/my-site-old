import express, { Express, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import { HtmlFC, Renderer } from "./Renderer";
import session from "express-session";
import { FlatApi, Api, ApiRoutes } from "lib/Api";
import { Manifest } from "lib/Manifest";

export abstract class Server
{
	private static instance: Server | null = null;

	public static get(): Server
	{
		if (!this.instance)
			throw new Error(`Server is not initialized yet!`);
		return this.instance;
	}

	public static async init<T extends Server>(ServerType: new (config: ServerConfig) => T, config: Partial<ServerConfig> = {}): Promise<Server>
	{
		if (this.instance)
			throw new Error(`Server is already initialized!`);
		this.instance = new ServerType({ title: "", host: "127.0.0.1", port: 8080, ...config, api: {}, session: {} });
		await this.instance.onLoad();
		this.instance.setupRequests();
		return this.instance;
	}

	private readonly Renderer: new (...args: any) => any;

	public readonly config: ServerConfig;
	public readonly express: Express;
	public readonly manifest: Manifest;
	public readonly api: FlatApi = {};
	public readonly clientApiManifest: string;

	public constructor(config: ServerConfig)
	{
		this.onConfigure(config);
		this.config = config;
		this.Renderer = this.config.renderer || Renderer;
		this.manifest = new Manifest();
		this.express = express();

		this.api = Api.flatten(config.api);
		this.clientApiManifest = Api.createManifest(this.api);

		if (!config.session.secret)
			console.warn(`No secret provided for the session!\nUsing default session secret!`);


		const ses = {
			secret: "keyboard cat",
			resave: true,
			saveUninitialized: true,
			cookie: { secure: false },
			...config.session
		};

		if (!env.isDev)
		{
			this.express.set('trust proxy', 1);
			ses.cookie.secure = true;
		}

		this.express.use(session(ses));

		this.express.use(bodyParser.json());
		this.express.use(bodyParser.urlencoded({ extended: true }));
		this.express.use(express.static("app"));

	}

	protected onConfigure(config: ServerConfig) { }

	protected async onLoad() { }

	private setupRequests()
	{
		this.express.all("/api/*", this.onApi.bind(this));
		this.express.get("*", this.onRender.bind(this));
	}

	private async onApi(req: Request, res: Response, next: NextFunction)
	{
		const [url] = req.url.split("?")
		const Api = this.api[url];
		if (Api)
		{
			const api: any = new Api(req, res);
			const m: any = req.method.toLowerCase();

			let data: any;
			let error: any;

			try
			{
				data = await api[m](m === "get" ? req.query : req.body);
			}
			catch (e)
			{
				error = (e as Error).message;
			}

			res.json({
				data,
				error
			});
		}
		else
		{
			next();
		}
	}

	protected async onRender(req: Request, res: Response)
	{
		if (req.session.redirectUrls?.includes(req.url))
		{
			const msg = `Redirect cycle detected! ${req.session.redirectUrls.join(" -> ")} -> ${req.url}`;
			req.session.redirectUrls = [];
			res.send(msg);
		}
		else
		{
			const renderer = new this.Renderer(this, req, res, this.config.title);

			const html = await renderer.render((url: string) => 
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

export type ServerConfig<T extends Renderer = Renderer> = {
	title: string;
	host: string;
	port: number;
	api: ApiRoutes<any>;
	session: Partial<session.SessionOptions>;
	renderer?: new (server: Server, req: Request, res: Response, title: string, htmlComponent: HtmlFC) => T;
};
