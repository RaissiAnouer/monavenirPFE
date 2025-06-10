const crypto = require('crypto');
const path = require('path');

const generateSecureFilename = (originalname) => {
  const ext = path.extname(originalname);
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${ext}`;
};

module.exports = { generateSecureFilename }; 