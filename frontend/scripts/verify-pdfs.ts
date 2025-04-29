import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const pdfsDir = path.join(publicDir, 'pdfs');

// Create pdfs directory if it doesn't exist
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
  console.log('Created pdfs directory at:', pdfsDir);
}

// List of required PDF files
const requiredPdfs = [
  'guide2024.pdf',
  'guide_technique_2024.pdf'
];

// Check each required PDF
requiredPdfs.forEach(pdfFile => {
  const pdfPath = path.join(pdfsDir, pdfFile);
  if (!fs.existsSync(pdfPath)) {
    console.error(`Missing PDF file: ${pdfFile} at ${pdfPath}`);
  } else {
    const stats = fs.statSync(pdfPath);
    console.log(`Found ${pdfFile} (${stats.size} bytes) at ${pdfPath}`);
  }
}); 