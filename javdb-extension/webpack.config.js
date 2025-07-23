const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    background: './src/background/background.js',
    content: './src/content/content.js',
    dashboard: './src/dashboard/dashboard.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/dashboard/dashboard.html',
      filename: 'dashboard.html',
      chunks: ['dashboard'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  mode: 'development',
  devtool: 'cheap-module-source-map',
  performance: {
    hints: false,
  },
  resolve: {
    fallback: {
      "util": require.resolve("util/"),
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
      "url": require.resolve("url/"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "assert": require.resolve("assert/"),
      "zlib": require.resolve("browserify-zlib"),
      "fs": false,
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!webdav)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }
    ]
  }
}; 