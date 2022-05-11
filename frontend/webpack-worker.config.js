/* eslint-disable @typescript-eslint/no-var-requires */
const glob = require('glob');
const path = require('path');
const webpack = require('webpack');

const src = path.resolve(__dirname, './src');
const build = path.resolve(__dirname, './public/worker'); // output worker.js to public folder

const tsLoader = {
    loader: 'ts-loader',
    options: { compilerOptions: { module: 'esnext', noEmit: false, target: 'es6' } },
};

const entries = {};
glob.sync('./src/workers/**/*.worker.ts').forEach((file) => {
    const basename = path.basename(file, '.ts');
    entries[basename] = file;
});

module.exports = {
    mode: 'none',
    target: 'webworker', // Importan! Use webworker target
    entry: entries,
    output: {
        filename: '[name].js',
        path: build,
    },
    resolve: {
        modules: ['node_modules', src],
        extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('development') }),
    ],
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: [tsLoader],
            },
        ],
    },
};
