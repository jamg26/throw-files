# Migration Guide: CRA/Craco to Rsbuild

This guide outlines the steps taken to migrate ThrowMyFile from Create React App (CRA) with Craco to Rsbuild.

## Key Changes

### 1. Build System Configuration

**Before (CRA/Craco):**
- Used `craco.config.js` for customizing webpack configuration
- Relied on `craco-less` plugin for Less support

**After (Rsbuild):**
- Uses `rsbuild.config.js` with Rsbuild plugins
- Less support provided by `@rsbuild/plugin-less`

### 2. Package Dependencies

**Added:**
- `@rsbuild/core`: Core Rsbuild package
- `@rsbuild/plugin-react`: React support for Rsbuild
- `@rsbuild/plugin-less`: Less support for Rsbuild
- `@rsbuild/plugin-node-polyfill`: Node.js polyfills for browser
- `less`: Required for Less compilation

**Removed:**
- `@craco/craco`: Craco configuration
- `craco-less`: Less support for Craco
- `react-scripts`: CRA scripts

### 3. Project Scripts

**Before:**
```json
"scripts": {
  "start": "env-cmd -f .env.dev craco start",
  "build": "craco build",
  "test": "craco test",
  "eject": "react-scripts eject"
}
```

**After:**
```json
"scripts": {
  "dev": "cross-env NODE_ENV=development rsbuild dev",
  "build": "rsbuild build",
  "preview": "rsbuild preview"
}
```

### 4. Proxy Configuration

**Before:**
- Used `setupProxy.js` with `http-proxy-middleware`

**After:**
- Proxy configured directly in `rsbuild.config.js`
```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

### 5. Environment Variables

**Before:**
- Used `.env.dev` with `env-cmd`
- Variables prefixed with `REACT_APP_`

**After:**
- Uses `.env.development` and `.env.production`
- Variables still prefixed with `REACT_APP_`
- Public URL now uses `RSBUILD_PUBLIC_URL`

### 6. Service Worker

**Before:**
- Service worker registration in `index.js`
- Worker script in `public/worker.js`

**After:**
- Same approach maintained
- Service worker registration in `index.js` 
- Worker script in `public/worker.js`

### 7. HTML Template

**Before:**
- CRA's HTML template with `%PUBLIC_URL%`

**After:**
- Rsbuild HTML template with `<%= process.env.RSBUILD_PUBLIC_URL %>`

### 8. CSS/Less Processing

**Before:**
- Less support via `craco-less`
- Imported antd styles with `~antd/dist/antd.less`

**After:**
- Less support via `@rsbuild/plugin-less`
- Imports updated to `antd/dist/antd.less` (removed tilde)

## Migration Steps

1. **Initialize Project Structure**
   - Set up basic directory structure
   - Create configuration files for Rsbuild

2. **Update Dependencies**
   - Add Rsbuild dependencies
   - Remove CRA/Craco dependencies

3. **Configuration Files**
   - Create `rsbuild.config.js`
   - Set up environment files
   - Update HTML templates

4. **Asset Migration**
   - Copy/update media files
   - Copy components, pages, and reducers

5. **Code Adjustments**
   - Update imports where needed
   - Update environment variable references
   - Ensure service worker is properly registered

## Testing and Verification

After migration, verify:

1. Application builds successfully (`npm run build`)
2. Development server works (`npm run dev`)
3. API proxy works correctly
4. Assets load properly (images, fonts, etc.)
5. Theme switching (light/dark) works correctly
6. File upload/download functionality works
7. Service worker is registered

## Known Issues and Solutions

- If build fails with Node.js polyfill errors, add the necessary polyfills using `@rsbuild/plugin-node-polyfill`
- If assets don't load, check path references and make sure the URLs include the proper environment variable prefix
- If proxying doesn't work, verify the proxy configuration in `rsbuild.config.js`