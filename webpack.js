const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: './example/index.js',
    plugins: [
        new webpack.ProvidePlugin({
            Promise: 'es6-promise',
        }),
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'docs'),
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                'style-loader',
                'css-loader',
                ],
            },
        ],
    },
    mode: 'production',
    devtool: 'inline-source-map',
    devServer: {
        watchContentBase: true,
        contentBase: './docs',
    },
    externals: {
        'mapbox-gl': 'mapboxgl'
    }
};