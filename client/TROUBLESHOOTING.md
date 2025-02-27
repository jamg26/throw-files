# Troubleshooting Guide for ThrowMyFile Rsbuild Migration

This document provides solutions to common issues you might encounter during the migration from CRA/Craco to Rsbuild.

## Template Errors

### Issue: `ReferenceError: process is not defined`

```
Error: Template execution failed: ReferenceError: process is not defined
```

**Solution:**
1. Change your HTML template to use direct paths without `process.env` references:
   ```html
   <!-- Instead of -->
   <link rel="icon" href="<%= process.env.RSBUILD_PUBLIC_URL %>/favicon.ico" />
   
   <!-- Use -->
   <link rel="icon" href="/favicon.ico" />
   ```

2. Update `rsbuild.config.js` to define the process.env.PUBLIC_URL variable:
   ```js
   tools: {
     bundlerChain: (chain) => {
       chain.plugin('define').tap((args) => {
         args[0]['process.env.PUBLIC_URL'] = JSON.stringify('');
         return args;
       });
     },
   },
   ```

3. Make sure assetPrefix is configured:
   ```js
   output: {
     assetPrefix: '/',
   },
   dev: {
     assetPrefix: '/',
   },
   ```

## Module Resolution Issues

### Issue: Cannot find module or its corresponding type declarations

This can happen if you're using imports that worked in CRA but don't resolve properly in Rsbuild.

**Solution:**
1. Check your import paths and make sure they're correct
2. Set up proper aliases in rsbuild.config.js:
   ```js
   source: {
     alias: {
       '@': path.resolve(__dirname, './src'),
     },
   },
   ```

## Less Import Issues

### Issue: Less file imports not working correctly

**Solution:**
1. Make sure `@rsbuild/plugin-less` is properly configured:
   ```js
   pluginLess({
     lessLoaderOptions: {
       lessOptions: {
         javascriptEnabled: true,
       },
     },
   }),
   ```

2. Update paths in Less files (remove tildes):
   ```less
   // Instead of
   @import "~antd/dist/antd.less";
   
   // Use
   @import "antd/dist/antd.less";
   ```

## Environment Variables

### Issue: Environment variables not available in application

**Solution:**
1. Make sure you've added the proper prefix to the rsbuild.config.js:
   ```js
   envPrefix: ['REACT_APP_', 'RSBUILD_'],
   ```

2. Use .env.development and .env.production for your variables

## Proxy Issues

### Issue: API requests not being proxied correctly

**Solution:**
1. Update the proxy configuration in rsbuild.config.js:
   ```js
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:5000',
         changeOrigin: true,
       },
     },
   },
   ```

## Service Worker Registration

### Issue: Service worker not registering correctly

**Solution:**
1. Make sure your worker.js file is in the public directory
2. Update the registration code to use the correct path
3. Verify the worker is being copied to the build output

## Build Output Issues

### Issue: Files not being copied to the build directory

**Solution:**
1. Make sure your copy configuration is correct:
   ```js
   output: {
     copy: [
       {
         from: './public',
         to: './',
         globOptions: {
           ignore: ['**/index.html'],
         },
       },
     ],
   },
   ```

## Running Locally

If you encounter issues running the development server:

1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Check for port conflicts (default is 3000)
3. Verify environment variables are set correctly