# ThrowMyFile Setup Guide

Follow these steps to set up the migrated ThrowMyFile application using Rsbuild.

## Prerequisites

- Node.js 16+ installed
- npm or yarn

## Installation Steps

1. **Clone/setup the repository**

   If you're starting fresh:
   ```bash
   git clone <repository-url>
   cd throw-files
   ```

2. **Install dependencies**

   ```bash
   cd client-rsbuild
   npm install
   ```

3. **Copy source files from CRA project**

   Run the migration scripts to copy necessary files:
   ```bash
   node migrate-assets.js
   node copy-public-assets.js
   ```

4. **Verify file structure**

   Ensure you have:
   - `src/media/scattered-forcefields.svg` and `scattered-forcefields-dark.svg`
   - `src/components/` with all needed components
   - `src/pages/` with home and privacy-policy components
   - `public/` with all assets

5. **Run in development mode**

   ```bash
   npm run dev
   ```

   Visit http://localhost:3000 to see your application.

## Missing Components

If you encounter errors about missing components, you may need to copy additional files from the original project.

### Common Files You May Need to Copy:

1. **Components**
   - Copy all component files from `client/src/components/` to `client-rsbuild/src/components/`

2. **Pages**
   - Copy home component from `client/src/pages/home/index.js` to `client-rsbuild/src/pages/home/index.js`
   - Copy privacy policy from `client/src/pages/privacy-policy/index.js` to `client-rsbuild/src/pages/privacy-policy/index.js`

3. **Reducers**
   - Copy Redux reducers from `client/src/reducers/` to `client-rsbuild/src/reducers/`

## Troubleshooting

### Environment Variables

If you have environment-specific settings, make sure they're properly configured in:
- `.env.development` for development
- `.env.production` for production builds

### Build Issues

- If you see errors about missing polyfills, check the `@rsbuild/plugin-node-polyfill` setup
- If you have issues with Less imports, make sure paths are correct in your Less files

### Assets Not Loading

- Check that public assets are properly copied
- Ensure paths use the correct environment variable prefix (`<%= process.env.RSBUILD_PUBLIC_URL %>` in HTML, `process.env.PUBLIC_URL` in JS)

## Building for Production

```bash
npm run build
```

The production build will be available in the `build` directory.

## Testing the Production Build Locally

```bash
npm run preview
```

This will serve the production build locally for testing.