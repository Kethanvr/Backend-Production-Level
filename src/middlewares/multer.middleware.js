import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/temp');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'), false);
    return;
  }
  cb(null, true);
};

// Create multer instance with error handling wrapper
const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Wrapper middleware to handle multer errors
export const upload = {
  fields: (fields) => (req, res, next) => {
    multerUpload.fields(fields)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: {
            code: err.code,
            field: err.field,
            message:
              err.message === 'Unexpected field'
                ? 'Invalid file field name'
                : err.message,
          },
        });
      }

      if (err) {
        console.error('File filter error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Error uploading file',
        });
      }

      // Log successful file upload details
      console.log('Files received:', {
        avatar: req.files?.avatar?.[0]?.originalname,
        coverimage: req.files?.coverimage?.[0]?.originalname,
      });

      next();
    });
  },
};
