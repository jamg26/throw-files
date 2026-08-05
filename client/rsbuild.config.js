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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    // No dev proxy: the client reaches the Worker directly over the WebSocket
    // URL in REACT_APP_BACKEND_URL. The previous `/api` -> localhost:5000 proxy
    // pointed at the Express server that was replaced by the Worker.
  },
  html: {
    // Title, description and social tags all live in public/index.html so they
    // stay in one place. Setting html.title here would override the template's.
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
      chain.plugin("define").tap((args) => {
        const env = process.env;

        // These are build-time substitutions, not runtime lookups: the bundler
        // replaces the literal text `window.ENV` in the source with the object
        // below. Changing them requires a rebuild, not a redeploy of config.
        args[0]["process.env.REACT_APP_BACKEND_URL"] = JSON.stringify(
          env.REACT_APP_BACKEND_URL || "",
        );
        args[0]["process.env.REACT_APP_FRONTEND_URL"] = JSON.stringify(
          env.REACT_APP_FRONTEND_URL || "",
        );
        args[0]["window.ENV"] = JSON.stringify({
          REACT_APP_BACKEND_URL: env.REACT_APP_BACKEND_URL || "",
          REACT_APP_FRONTEND_URL: env.REACT_APP_FRONTEND_URL || "",
        });

        return args;
      });
    },
  },
});
