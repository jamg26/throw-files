# ThrowMyFile Client (Rsbuild)

This is the frontend for ThrowMyFile, migrated from Create React App (CRA) with Craco to Rsbuild.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `npm run preview`

Serves the production build locally for testing and preview.

## Migration from CRA/Craco to Rsbuild

This project has been migrated from Create React App (CRA) with Craco to Rsbuild. Key changes include:

1. Replaced craco.config.js with rsbuild.config.js
2. Updated package.json dependencies and scripts
3. Modified proxy configuration
4. Updated environment variable handling
5. Ensured Less support works properly

## Directory Structure

- `public/` - Static assets that should be copied to the build directory
- `src/` - Source code
  - `components/` - Reusable React components
  - `media/` - Images and other media assets
  - `pages/` - React components that represent pages
  - `reducers/` - Redux reducers
  - `App.js` - Main app component
  - `App.less` - Main styles
  - `index.js` - Entry point

## Learn More

- [Rsbuild Documentation](https://rsbuild.dev/)
- [React Documentation](https://reactjs.org/)