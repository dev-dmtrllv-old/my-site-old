const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const { resolve } = require("./paths");
const baseConfig = require("./webpack.base");
const ManifestPlugin = require("./ManifestPlugin");
const { writeFileSync } = require("fs");

module.exports = (dev = true) => baseConfig({
	name: "app",
	dev,
	entry: "src/app/index.tsx",
	rules: [
		{
			test: /\.(glsl|vert|frag)$/i,
			use: "raw-loader",
		},
		{
			test: /\.s?(c|a)ss$/,
			use: [
				MiniCssExtractPlugin.loader,
				"css-loader",
				"sass-loader",
			],
			exclude: /node_modules/
		},
		{
			test: /\.(jpe?g|png|gif|svg|ico|webp)$/i,
			use: {
				loader: "url-loader",
				options: {
					fallback: "file-loader",
					limit: 40000,
					name: "images/[name].[ext]",
				},
			},
		}
	],
	output: "dist/app",
	plugins: [
		new MiniCssExtractPlugin({
			filename: `css/[name].bundle.css`,
			chunkFilename: `css/[id].chunk.css`,
			ignoreOrder: false
		}),
		new CopyPlugin({
			patterns: [
				{
					from: resolve("src","assets"),
					to: resolve("dist", "app", "assets")
				},
			],
		}),
		new ManifestPlugin((manifest) => writeFileSync(resolve("dist", "manifest.json"), JSON.stringify(manifest, null, dev ? 4 : 0), "utf-8"))
	]
});
