/**
 * Migration script for ThrowMyFile - from CRA/Craco to Rsbuild
 * 
 * This script helps with:
 * 1. Creating required directories
 * 2. Copying media files and assets
 * 3. Preparing the project for first run
 * 
 * Run with: node migrate-assets.js
 */

const fs = require('fs');
const path = require('path');

// Source and destination paths
const SRC_DIR = '../client';
const DEST_DIR = '.';

// Directories to ensure they exist
const DIRECTORIES = [
  'src/media',
  'src/components',
  'src/pages',
  'src/pages/home',
  'src/pages/privacy-policy',
  'src/reducers',
  'public'
];

// Files to copy from client to client-rsbuild
const FILES_TO_COPY = [
  { src: 'src/media/scattered-forcefields.svg', dest: 'src/media/scattered-forcefields.svg' },
  { src: 'src/media/scattered-forcefields-dark.svg', dest: 'src/media/scattered-forcefields-dark.svg' },
  { src: 'src/media/buymeacoffee.png', dest: 'src/media/buymeacoffee.png' },
  
  // Components
  { src: 'src/components/index.js', dest: 'src/components/index.js' },
  // Add other component files as needed
  
  // Pages
  { src: 'src/pages/index.js', dest: 'src/pages/index.js' },
  { src: 'src/pages/home/index.js', dest: 'src/pages/home/index.js' },
  { src: 'src/pages/privacy-policy/index.js', dest: 'src/pages/privacy-policy/index.js' },
  
  // Reducers
  { src: 'src/reducers/index.js', dest: 'src/reducers/index.js' },
  // Add other reducer files as needed
  
  // Public assets
  { src: 'public/favicon.ico', dest: 'public/favicon.ico' },
  { src: 'public/logo192.png', dest: 'public/logo192.png' },
  { src: 'public/logo512.png', dest: 'public/logo512.png' },
  { src: 'public/android-chrome-192x192.png', dest: 'public/android-chrome-192x192.png' },
  { src: 'public/apple-touch-icon.png', dest: 'public/apple-touch-icon.png' },
  { src: 'public/browserconfig.xml', dest: 'public/browserconfig.xml' },
  { src: 'public/favicon-16x16.png', dest: 'public/favicon-16x16.png' },
  { src: 'public/favicon-32x32.png', dest: 'public/favicon-32x32.png' },
  { src: 'public/mstile-150x150.png', dest: 'public/mstile-150x150.png' },
  { src: 'public/og_image.png', dest: 'public/og_image.png' },
  { src: 'public/robots.txt', dest: 'public/robots.txt' },
  { src: 'public/safari-pinned-tab.svg', dest: 'public/safari-pinned-tab.svg' },
  { src: 'public/site.webmanifest', dest: 'public/site.webmanifest' }
];

// Create required directories
function createDirectories() {
  console.log('Creating required directories...');
  DIRECTORIES.forEach(dir => {
    const dirPath = path.join(DEST_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(` - Created ${dirPath}`);
    } else {
      console.log(` - ${dirPath} already exists`);
    }
  });
}

// Copy files from source to destination
function copyFiles() {
  console.log('\nCopying files...');
  FILES_TO_COPY.forEach(file => {
    try {
      const srcPath = path.join(SRC_DIR, file.src);
      const destPath = path.join(DEST_DIR, file.dest);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(` - Copied ${file.src} to ${file.dest}`);
      } else {
        console.error(` - ERROR: Source file not found: ${srcPath}`);
      }
    } catch (error) {
      console.error(` - ERROR copying ${file.src}: ${error.message}`);
    }
  });
}

// Main execution
function main() {
  console.log('ThrowMyFile - Migration from CRA/Craco to Rsbuild\n');
  
  // Create directories
  createDirectories();
  
  // Copy files
  copyFiles();
  
  console.log('\nMigration completed!');
  console.log('\nNext steps:');
  console.log('1. Review copied files and ensure all necessary assets are included');
  console.log('2. Run "npm install" to install dependencies');
  console.log('3. Run "npm run dev" to start the development server');
}

main();