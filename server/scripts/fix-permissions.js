const fs = require('fs');
const path = require('path');

const documentsDir = path.resolve(__dirname, '..', 'uploads', 'documents');

console.log('Checking documents directory:', documentsDir);

try {
  // Ensure the directory exists
  if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true, mode: 0o755 });
    console.log('Created documents directory');
  }

  // Set directory permissions
  fs.chmodSync(documentsDir, 0o755);
  console.log('Set directory permissions to 755');

  // List and fix permissions for all PDF files
  const files = fs.readdirSync(documentsDir);
  console.log('Found files:', files);

  files.forEach(file => {
    if (file.endsWith('.pdf')) {
      const filePath = path.join(documentsDir, file);
      try {
        // Set file permissions to readable
        fs.chmodSync(filePath, 0o644);
        console.log(`Set permissions for ${file} to 644`);

        // Verify file is readable
        fs.accessSync(filePath, fs.constants.R_OK);
        const stats = fs.statSync(filePath);
        console.log(`File ${file} stats:`, {
          size: stats.size,
          permissions: stats.mode.toString(8),
          isFile: stats.isFile()
        });
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  });

  console.log('Finished processing files');
} catch (err) {
  console.error('Error:', err);
} 