import { Router } from 'express';
import { RegisterUser } from '../controllers/user.controllers.js';
import { upload } from '../middlewares/multer.middleware.js';
import { mkdir } from 'node:fs/promises';

const router = Router();

// First create the directory if it doesn't exist
try {
  await mkdir('./public/temp', { recursive: true });
} catch (err) {
  console.log('Temp directory already exists or could not be created');
}

router.route('/register').post(
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverimage', maxCount: 1 },
  ]),
  RegisterUser,
);

export default router;
