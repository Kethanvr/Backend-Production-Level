import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { uploadoncloudinary } from '../utils/cloudinary.js';
// import useresponse from '../utils/useresponse.js';
import ApiResponse from '../utils/ApiResponse.js';

const GenerateAccessTokenndRefreshtoken = async(userid)=>{
  try {
   const user = await User.findById(userid)

   const accessToken= user.generateAccessToken()
   const refreshToken= user.generateRefreshToken()

   user.refreshToken = refreshToken
   user.save({valiDateBeforeSave : false})

   return {accessToken,refreshToken}

  } catch (error) {
    throw new ApiError(500,'error while generating acees and refresh token')
  }
}




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

const LoginUser = asyncHandler( async (req ,res) => {
 // take input from user
 // check all field are crt and present 
 // validate with db 
 // generate access and refreh token
  // send response back to user
    const { email, username, password} = req.body;

    if (! email || ! username ) {
      throw new ApiError(400, 'Email or username is required');
      }

    const user  = await User.findOne({
      $or: [{email},{username}]
    })

    if(!user){
      throw new ApiError(400,'user not found')
    }

    const PasswordVaild = await user.isPasswordCorrect(password)

    if(!PasswordVaild){
      throw new ApiError(401,'password is incorrect')
    }

    const {accessToken, refreshToken} = await GenerateAccessTokenndRefreshtoken(user._id)

    const Loggedinuser = await User.findOne(user._id).select("-password -refreshtoken")

    const options = {
      httpOnly:true,
      secure:true
    }

    return res.
    status(200)
    .cookie('refreshToken',refreshToken,options)
    .cookie('accessToken',accessToken,options)
    .json(
      new ApiResponse(200, 
        {
          user  : Loggedinuser,
          accessToken,
          refreshToken
        },
        'User logged in successfully'
        )
    )
})

const LogoutUser = asyncHandler(async (req, res) => {
  // clear the cookie
  // clear the refreshtoken from db
  // send response back to user
  // res.clearCookie('refreshToken')
  // res.clearCookie('accessToken')

  // const user = await User.findById(req.user._id)

  // user.refreshToken = null
  // user.save({validateBeforeSave : false})

  // return res.status(200).json(new ApiResponse(200, {}, 'User logged out successfully'))

  await User.findByIdAndUpdate(req.user.id,{
    $set : {refreshtoken : undefined}
  },
  {new : true},
  )
  
  const options = {
    httpOnly:true,
    secure:true
  }

  return res.status(200)
  .clearCookie('refreshToken',options) 
  .clearCookie('accessToken',options)
  .json(new ApiResponse(200, {}, 'User logged out successfully'))
})


export { RegisterUser , LoginUser,LogoutUser  }
