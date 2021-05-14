const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const Dotenv = require ( "dotenv-webpack" );


const config = {
  entry: './app/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.bundle.js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json']
    },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },

      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ]
      },

      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
            'file-loader'
        ]
      },
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({template: './app/index.html',
                           favicon: './app/images/favicon.ico'}),
    new Dotenv({path: process.env.NODE_ENV === "development" ? "./.env.development": "./.env.production" })
  ],
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    host: "0.0.0.0",
    port: 9000,
    hot: true,
    historyApiFallback: true,
  }
};

module.exports = config;