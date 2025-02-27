import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginLess } from "@rsbuild/plugin-less";
import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";
import path from "path";

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginLess({
      lessLoaderOptions: {
        lessOptions: {
          javascriptEnabled: true,
        },
      },
    }),
    pluginNodePolyfill(),
  ],
  source: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  html: {
    title: "ThrowMyFile",
    template: path.resolve(__dirname, "./public/index.html"),
  },
  output: {
    distPath: {
      root: "build",
    },
    copy: [
      {
        from: "./public",
        to: "./",
        globOptions: {
          ignore: ["**/index.html"],
        },
      },
    ],
    assetPrefix: "/",
  },
  tools: {
    bundlerChain: (chain) => {
      // Make environment variables available in the client
      chain.plugin("define").tap((args) => {
        const env = process.env;
        
        // Add common environment variables
        args[0]["process.env.PUBLIC_URL"] = JSON.stringify("");
        args[0]["process.env.REACT_APP_BACKEND_URL"] = JSON.stringify(env.REACT_APP_BACKEND_URL || "");
        args[0]["process.env.REACT_APP_FRONTEND_URL"] = JSON.stringify(env.REACT_APP_FRONTEND_URL || "");
        
        // Expose environment variables to the browser via window.ENV
        args[0]["window.ENV"] = JSON.stringify({
          REACT_APP_BACKEND_URL: env.REACT_APP_BACKEND_URL || "",
          REACT_APP_FRONTEND_URL: env.REACT_APP_FRONTEND_URL || "",
        });
        
        return args;
      });
    },
  },
  dev: {
    assetPrefix: "/",
  },
  envPrefix: ["REACT_APP_", "RSBUILD_"],
});