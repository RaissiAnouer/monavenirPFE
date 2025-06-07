const fs = require('fs').promises;
const path = require('path');

const documentsDir = path.resolve(__dirname, '..', 'uploads', 'documents');

console.log('Checking documents directory:', documentsDir);

(async () => {
  try {
    // Ensure the directory exists
    if (!await fs.access(documentsDir).then(() => true).catch(() => false)) {
      await fs.mkdir(documentsDir, { recursive: true, mode: 0o755 });
      console.log('Created documents directory');
    }

    // Set directory permissions
    await fs.chmod(documentsDir, 0o755);
    console.log('Set directory permissions to 755');

    // List and fix permissions for all PDF files
    const files = await fs.readdir(documentsDir);
    console.log('Found files:', files);

    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const filePath = path.join(documentsDir, file);
        try {
          await fs.chmod(filePath, 0o644);
          console.log(`Set permissions for ${file} to 644`);

          await fs.access(filePath, fs.constants.R_OK);
          const stats = await fs.stat(filePath);
          console.log(`File ${file} stats:`, {
            size: stats.size,
            permissions: (stats.mode & 0o777).toString(8),
            isFile: stats.isFile(),
          });
        } catch (err) {
          console.error(`Error processing ${file}:`, err);
        }
      }
    }

    console.log('Finished processing files');
  } catch (err) {
    console.error('Error:', err);
  }
})();
