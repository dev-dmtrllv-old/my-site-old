const baseConfig = require("./webpack.base");

module.exports = (dev = true) => baseConfig({
	isServer: true,
	dev,
	entry: "src/server/index.tsx",
	rules: [
		{
			test: /\.s[ac]ss$/i,
			loader: "ignore-loader"
		},
	],
	splitChunks: false,
	clean: false,
	plugins: []
});
