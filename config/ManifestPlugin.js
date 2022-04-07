
module.exports = class ManifestPlugin
{
	static name = "ManifestPlugin";

	constructor(cb)
	{
		this.cb = cb;
	}

	transformPath = (p) =>
	{
		if (p.startsWith("."))
			return p.substr(1, p.length);
		else if (!p.startsWith("/"))
			return "/" + p;
		else
			return p;
	}

	apply = (compiler) =>
	{
		compiler.hooks.emit.tapAsync(ManifestPlugin.name, (c, cb) =>
		{
			const manifest = {
				main: {},
				chunks: {}
			};

			for (const { files, name, id } of c.chunks)
			{
				if (name)
				{
					manifest.main[name === "main" ? "app" : name] = {
						id,
						files: []
					};

					files.forEach((p) => manifest.main[name === "main" ? "app" : name].files.push(this.transformPath(p)));
				}
			}

			for (const { chunks, origins } of c.chunkGroups)
			{
				const origin = origins && origins[0];
				if (origin)
				{
					const fileName = origin.request;
					if (fileName)
					{
						for (const { id, files } of chunks)
						{
							manifest.chunks[fileName] = {
								id,
								files: []
							};

							files.forEach((p) => manifest.chunks[fileName].files.push(this.transformPath(p)));
						}
					}
				}
			}

			this.cb(manifest);
			cb();
		});
	}
}
