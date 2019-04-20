"use strict";

const path = require("path");
const webpack = require("webpack");

module.exports = env => {
  return {
    context: path.join(__dirname, "./"),
    mode: "development",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                declaration: false
              },
              configFile: "tsconfig.json"
            }
          }
        }
      ]
    },
    resolve: {
      extensions: [".ts", ".js"]
    }
  };
};
