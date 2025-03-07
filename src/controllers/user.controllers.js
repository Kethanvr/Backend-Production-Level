import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { uploadoncloudinary } from '../utils/cloudinary.js';
// import useresponse from '../utils/useresponse.js';
import ApiResponse from '../utils/ApiResponse.js';

const RegisterUser = asyncHandler(async (req, res) => {
  console.log('Files received:', req.files);
  console.log('Body received:', req.body);

  const { username, fullname, email, password } = req.body;

  // Validate each field individually for better error messages
  if (!username) throw new ApiError(400, 'Username is required');
  if (!fullname) throw new ApiError(400, 'Full name is required');
  if (!email) throw new ApiError(400, 'Email is required');
  if (!password) throw new ApiError(400, 'Password is required');

  // Validate file uploads
  if (!req.files || !req.files.avatar || !req.files.avatar[0]) {
    throw new ApiError(400, 'Avatar file is required');
  }

  // check if user already exists
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(400, 'User already exists');
  }

  // Get local path of uploaded files
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverimage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file path not found');
  }

  try {
    // Upload avatar to cloudinary
    console.log('Uploading avatar from path:', avatarLocalPath);
    const avatarResponse = await uploadoncloudinary(avatarLocalPath);

    if (!avatarResponse || !avatarResponse.url) {
      throw new ApiError(400, 'Error uploading avatar to cloudinary');
    }

    // Upload cover image if provided
    let coverImageResponse = null;
    if (coverImageLocalPath) {
      console.log('Uploading cover image from path:', coverImageLocalPath);
      coverImageResponse = await uploadoncloudinary(coverImageLocalPath);
    }

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      email,
      fullname,
      avatar: avatarResponse.url,
      coverimage: coverImageResponse?.url || '',
      password,
    });

    const createdUser = await User.findById(user._id).select(
      '-password -refreshtoken',
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        'Something went wrong while registering the user',
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, 'User registered successfully'));
  } catch (error) {
    console.error('Error during registration:', error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || 'Something went wrong during registration',
    );
  }
});

export { RegisterUser };
