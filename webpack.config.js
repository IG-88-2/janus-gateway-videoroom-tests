const path = require(`path`);
const webpack = require(`webpack`);
const CleanWebpackPlugin = require(`clean-webpack-plugin`);
const CopyWebpackPlugin = require(`copy-webpack-plugin`);



module.exports = {

	context: __dirname,

	mode : `development`,

	entry : {
		'test' : `./tests.ts`
	},
	
	output : {
		filename : `[name].js`,
		path : path.resolve(__dirname, `tests`)
	},

	resolve : {
		extensions : [ `.ts`, `.tsx`, `.js` ]
	},

	module : {
		rules : [
			{
				test : /\.(ts|tsx)?$/,
				exclude : /(node_modules)/,
				loader : `ts-loader`
			},
			{
				test : /\.js$/,
				exclude : /(node_modules|bower_components)/,
				loader : `babel-loader`,
				options : {
					presets : [ `@babel/preset-env` ]
				}
			}
		]
	},

	devtool : `source-map`,

	target : `node`,

	plugins : [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV' : JSON.stringify(`development`),
			'process.mode' : JSON.stringify(`development`)
		}),
		new CopyWebpackPlugin([ 
			{ from : "./janus-gateway-videoroom-demo/development", to : "development" }
		])
	],
	
	externals: {
		puppeteer: 'require("puppeteer")',
	},
	
	node : {
		__dirname : false,
		__filename : false
	}

};
