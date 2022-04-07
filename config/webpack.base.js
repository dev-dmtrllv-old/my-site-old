const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

const { resolve } = require("./paths");
const aliases = require("./aliases");

module.exports = (options = {}) =>
{
	const {
		clean = true,
		dev = true,
		rules = [],
		tsConfig = "tsconfig.json",
		output = "dist",
		splitChunks = true,
		plugins = [],
		isServer = false,
		entry
	} = options;

	if (!splitChunks)
		plugins.push(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }));

	return {
		name: isServer ? "server" : "app",
		target: isServer ? "node" : "web",
		mode: dev ? "development" : "production",
		stats: "minimal",
		entry: resolve(entry),
		devtool: "source-map",
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: "ts-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.js$/,
					use: ["source-map-loader"],
					enforce: "pre"
				},
				...rules
			],
		},
		resolve: {
			extensions: [".tsx", ".ts", ".js", ".json"],
			alias: aliases(tsConfig)
		},
		output: {
			filename: `${isServer ? "" : "js/"}[name].bundle.js`,
			chunkFilename: `${isServer ? "" : "js/"}[name]${dev ? "" : ".[chunkhash]"}.chunk.js`,
			path: resolve(output),
			publicPath: "/",
			clean
		},
		plugins: [...plugins, new webpack.DefinePlugin({
			env: {
				isDev: dev,
				isServer,
				isClient: !isServer
			}
		})],
		optimization: (splitChunks && !isServer) ? {
			runtimeChunk: "single",
			splitChunks: {
				chunks: "all",
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: "vendors",
						chunks: "all",
						enforce: true,
					}
				}
			}
		} : {},
		experiments: {
			topLevelAwait: true
		},
		externals: isServer ? [nodeExternals()] : []
	}
}
