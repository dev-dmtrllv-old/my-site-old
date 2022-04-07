import fs from "fs";

export class Manifest
{
	private data!: ManifestData;

	private defaultScripts: string[] = [];
	private defaultStyles: string[] = [];

	private update(): ManifestData
	{
		const data = fs.readFileSync("manifest.json", "utf-8");
		this.data = JSON.parse(data);

		this.defaultScripts = [
			...this.getPaths(true, "runtime", "js"),
			...this.getPaths(true, "vendors", "js"),
			...this.getPaths(true, "app", "js"),
		];

		this.defaultStyles = [
			...this.getPaths(true, "runtime", "css"),
			...this.getPaths(true, "vendors", "css"),
			...this.getPaths(true, "app", "css"),
		];

		return this.data;
	}

	public constructor()
	{
		if (env.isDev)
		{
			fs.watchFile("manifest.json", { interval: 200 }, () => 
			{
				this.update();
			});
		}

		this.update();
	}

	private getPaths = (main: boolean, target: string, extension: string) => (this.data[main ? "main" : "chunks"] as any)[target].files.filter((s: string) => s.endsWith(extension));

	public get = (imports: string[], extension: "css" | "js") =>
	{
		const paths = [...(extension === "js" ? this.defaultScripts : this.defaultStyles)];

		// imports.forEach(s => 
		// {
		// 	console.log(s);
		// });

		Object.keys(this.data.chunks).forEach(s => 
		{
			for (let i of imports)
			{
				if (s.startsWith(i))
				{
					this.data.chunks[s].files.forEach(f => 
					{
						if (f.endsWith(extension))
							paths.push(f);
					});
				}
			}
		});
		return paths;
	}
}

export type ChunkInfo = {
	id: string;
	files: string[];
};

type ManifestData = {
	main: { app: ChunkInfo; runtime: ChunkInfo; vendors: ChunkInfo; };
	chunks: { [key: string]: ChunkInfo; };
};
