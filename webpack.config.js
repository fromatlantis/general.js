var path = require('path');
var fs = require('fs');

var webpack = require('webpack');
var _ = require('lodash');
var glob = require('glob');
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin

var ExtractTextPlugin = require('extract-text-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin');

var fetchPlugin=new webpack.ProvidePlugin({
  'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
})

var config = require('./config.json')
var srcDir = path.resolve(process.cwd(), config.devPath);
var assets = path.resolve(process.cwd(), config.buildPath);

var nodeModPath = path.resolve(__dirname, './node_modules');
//var pathMap = require('./src/pathmap.json')
var extractCSS
var cssLoader
var sassLoader
var debug = true;
//var publicPath = '';
// 这里publicPath要使用绝对路径，不然scss/css最终生成的css图片引用路径是错误的，应该是css-loader的bug
//var publicPath = '/';//绝对路径
var publicPath = config.publicPath;//虚拟绝对路径，跟线上环境路径一致

var entries = (function() {
    var jsDir = path.resolve(srcDir, 'javascripts')
    var entryFiles = glob.sync(jsDir + '/*.{js,jsx}')
    var map = {}

    entryFiles.forEach((filePath) => {
        var filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
        map[filename] = filePath
    })

    return map
}())

//var chunks = Object.keys(entries)

var plugins =function() {
    var entryHtml = glob.sync(srcDir + '/*.html')
    var r = []

    entryHtml.forEach(function(filePath) {

        var filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
        var conf = {
            template: filePath,
            filename: filename + '.html'
        }

        if(filename in entries) {
            conf.inject = 'body'
            conf.chunks = ['common', filename]
        }

        //if(/b|c/.test(filename)) conf.chunks.splice(2, 0, 'common-b-c')

        r.push(new HtmlWebpackPlugin(conf))
    })

    return r
}()
if(debug) {
    extractCSS = new ExtractTextPlugin('stylesheets/[name].css?[contenthash]')
    cssLoader = extractCSS.extract(['css'])
    sassLoader = extractCSS.extract(['css', 'sass'])
    plugins.push(extractCSS,new webpack.HotModuleReplacementPlugin())
} else {
    extractCSS = new ExtractTextPlugin('stylesheets/[contenthash:8].[name].min.css', {
        // 当allChunks指定为false时，css loader必须指定怎么处理
        // additional chunk所依赖的css，即指定`ExtractTextPlugin.extract()`
        // 第一个参数`notExtractLoader`，一般是使用style-loader
        // @see https://github.com/webpack/extract-text-webpack-plugin
        allChunks: false
    })
    cssLoader = extractCSS.extract(['css?minimize'])
    sassLoader = extractCSS.extract(['css?minimize', 'sass'])

    plugins.push(
        extractCSS,
        new UglifyJsPlugin({
            compress: {
                warnings: false
            },
            output: {
                comments: false
            },
            mangle: {
                except: ['$', 'exports', 'require']
            }
        }),
        // new AssetsPlugin({
        //     filename: path.resolve(assets, 'source-map.json')
        // }),
        new webpack.optimize.DedupePlugin(),
        new webpack.NoErrorsPlugin()
    )

    plugins.push(new UglifyJsPlugin())
}
module.exports = {

  entry: entries,
  output: {
    path: assets,
    filename: debug ? 'javascripts/[name].js' : 'javascripts/[chunkhash:8].[name].min.js',
    //chunkFilename: debug ? '[chunkhash:8].chunk.js' : 'javascripts/[chunkhash:8].chunk.min.js',
    //hotUpdateChunkFilename: debug ? '[id].js' : 'js/[id].[chunkhash:8].min.js',
    publicPath: publicPath
  },
  plugins: [new CommonsChunkPlugin({
                name: 'common',
                chunks: ['common']
            })].concat(plugins),
  module: {
      loaders: [
          {
            test: /\.((woff2?|svg)(\?v=[0-9]\.[0-9]\.[0-9]))|(woff2?|svg|jpe?g|png|gif|ico)$/,
            loaders: [
                // url-loader更好用，小于10KB的图片会自动转成dataUrl，
                // 否则则调用file-loader，参数直接传入
                'url?limit=10000&name=images/[hash:8].[name].[ext]',
                'image?{bypassOnDebug:true, progressive:true,optimizationLevel:3,pngquant:{quality:"65-80",speed:4}}'
            ]
          },
          {
            test: /\.((ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9]))|(ttf|eot)$/,
            loader: 'url?limit=10000&name=fonts/[hash:8].[name].[ext]'
          },
          {test: /\.css$/, loader: cssLoader},
          {test: /\.scss$/, loader: sassLoader},
          { test: /\.html$/, loader: 'html-loader' }
      ]
  }
};