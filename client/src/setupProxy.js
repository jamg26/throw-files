// This file is not used directly by Rsbuild
// The proxy settings are in rsbuild.config.js
// This is kept for reference only

const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:5000",
      changeOrigin: true,
    })
  );
};