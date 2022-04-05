const { resolve } = require("./paths");

const aliases = (tsConfigPath = "tsconfig.json") =>
{
	const tsConfig = require(resolve(tsConfigPath));

	const { baseUrl, paths } = tsConfig.compilerOptions;

	const aliases = {};

	Object.keys(paths).forEach(k =>
	{
		const prop = k.replace("/*", "").replace("./", "");
		
		if (!aliases[prop])
			aliases[prop] = resolve(baseUrl, paths[k][0]);
	});
	return aliases;
}

module.exports = aliases;
