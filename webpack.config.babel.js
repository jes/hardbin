// const path = require("path");
import path from "path";
import CleanWebpackPlugin from "clean-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { getIfUtils, removeEmpty } from "webpack-config-utils";

export default env => {
  const { ifTest, ifProd } = getIfUtils(env);

  return {
    cache: ifProd(),

    mode: ifProd("production", "development"),
    devtool: "inline-source-map",

    devServer: {
      contentBase: "/dist/",
      publicPath: "/dist/"
    },

    plugins: [
      new CleanWebpackPlugin(["dist"]),
      ifTest(
        new HtmlWebpackPlugin({
          template: "./test/index.html"
        }),
        new HtmlWebpackPlugin({
          favicon: "./img/h.png",
          template: "./index.html"
        })
      )
    ],
    node: { fs: "empty", module: "empty" },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"]
        },
        // { test: /\.png$/, use: "url-loader?mimetype=image/png" }
        { test: /\.(png|jpg|gif)$/i, use: ["url-loader"] }
      ]
    },

    entry: ifTest(["./test/setup.js", "./test/index.js"], "./src/main.js"),
    output: {
      // use absolute paths in sourcemaps (important for debugging via IDE)
      // devtoolModuleFilenameTemplate: "[absolute-resource-path]",
      // devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]?[hash]",
      filename: "[name].bundle.js",
      chunkFilename: "[name].bundle.js",
      path: path.resolve(__dirname, "dist"),
      // publicPath: "/dist/"
    }
  };
};
