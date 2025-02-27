/**
 * Script to copy public assets from the original CRA project
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'client', 'public');
const destDir = path.join(__dirname, 'public');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Get all files from source directory
try {
  const files = fs.readdirSync(sourceDir);
  
  // Skip index.html as we've already created a custom one for Rsbuild
  const filesToCopy = files.filter(file => file !== 'index.html');
  
  // Copy each file
  for (const file of filesToCopy) {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    
    // Skip directories (we only want to copy files)
    if (fs.statSync(sourcePath).isDirectory()) {
      console.log(`Skipping directory: ${file}`);
      continue;
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied: ${file}`);
  }
  
  console.log('\nAll public assets copied successfully!');
} catch (error) {
  console.error('Error copying public assets:', error);
}