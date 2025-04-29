import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const pdfsDir = path.join(publicDir, 'pdfs');

// Create pdfs directory
try {
  if (!fs.existsSync(pdfsDir)) {
    fs.mkdirSync(pdfsDir, { recursive: true });
    console.log('✅ Created pdfs directory at:', pdfsDir);
  } else {
    console.log('ℹ️ PDFs directory already exists at:', pdfsDir);
  }
} catch (error) {
  console.error('❌ Error creating pdfs directory:', error);
}

// Create sample PDF if needed
const samplePdfPath = path.join(pdfsDir, 'guide2024.pdf');
if (!fs.existsSync(samplePdfPath)) {
  try {
    // Create an empty PDF file as placeholder
    fs.writeFileSync(samplePdfPath, '%PDF-1.4\n%EOF\n');
    console.log('✅ Created sample PDF at:', samplePdfPath);
    console.log('⚠️ Please replace this with your actual PDF file');
  } catch (error) {
    console.error('❌ Error creating sample PDF:', error);
  }
} 