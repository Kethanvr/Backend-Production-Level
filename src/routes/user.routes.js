import { Router } from 'express';
import { UpdateAccountdetails,UpdateUserAvatar,UpdateUserCoverImage,GetChannelProfile,GetWatchHistory ,GetCurrentUser, LoginUser , LogoutUser, PasswordReset, RefreshAccessToken, RegisterUser } from '../controllers/user.controllers.js';
import { upload } from '../middlewares/multer.middleware.js';
import { mkdir } from 'node:fs/promises';
import { verityJWT } from '../middlewares/auth.middleware.js';

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

router.route('/login').post(LoginUser);

// secure route
router.route('/logout').post( verityJWT ,LogoutUser)
router.route('refresh-Token').post(RefreshAccessToken)
router.route('/password-reset').post( verityJWT ,PasswordReset)
router.route('current-user').get( verityJWT , GetCurrentUser )
router.route('/update-account-details').patch( verityJWT ,UpdateAccountdetails)
router.route('/update-user-avatar').patch( verityJWT ,upload.single('avatar'),UpdateUserAvatar)
router.route('/update-user-cover-image').patch( verityJWT ,upload.single('coverimage'),UpdateUserCoverImage)
router.route('/channel-profile/:id').get( verityJWT,GetChannelProfile)
router.route('/watch-history').get( verityJWT ,GetWatchHistory)



export default router;
