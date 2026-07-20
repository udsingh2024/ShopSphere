const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const filename = file.originalname.toLowerCase();
  
  // Prevent double-extension tricks and script uploads masquerading as images
  const isSuspicious = /\.(exe|bat|cmd|sh|php|pl|py|js|jsp|asp|sh|bin|wsf|vbs)$/.test(filename) || 
                       filename.includes('.exe.') || 
                       filename.includes('.php.') || 
                       filename.includes('.js.');
                       
  if (isSuspicious) {
    return cb(new Error('Unsafe file upload attempt blocked! Executables are rejected.'), false);
  }

  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter,
});

module.exports = upload;
