import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { uploadoncloudinary } from '../utils/cloudinary.js';
// import useresponse from '../utils/useresponse.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import e from 'express';

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

    if (! email && ! username ) {
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

const RefreshAccessToken = asyncHandler(async( req, res) =>{
  // get the refreshtoken from cookie
  // check if the refreshtoken is present
  // verify the refreshtoken
  // generate new access token
  // send response back to user
  // const {refreshToken} = req.cookies

  // if(!refreshToken){
  //   throw new ApiError(401,'Unauthorised Request')
  // }

  // const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET)

  // const user = await User.findById(decoded._id



  const IncomingRefreshToken =req.cookies.refreshToken 

  if(!IncomingRefreshToken){
    throw new ApiError(401,'Unauthorised Request')
  }

  try {
    const DecodedToken = jwt.verify(IncomingRefreshToken , process.env.REFRESH_TOKEN_SECRET )
  
    const user = await User.findById(DecodedToken?._id)
  
    if(!user){
      throw new ApiError(401,'User not found invalid token')
    }
  
    if (IncomingRefreshToken !==  user.refreshtoken) {
      throw new ApiError(401,'Invalid token')
    }
  
    const options = {
      httpOnly:true,
      secure:true
    }
  
    const {accessToken , newrefreshToken} = await GenerateAccessTokenndRefreshtoken(user._id)
  
    return res.status(200)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',newrefreshToken,options)
    .json(new ApiResponse(200,{accessToken,newrefreshToken},'Token refreshed successfully'))
  } catch (error) {
    throw new ApiError(401, error?.message || 'Unauthorised Request invalid Refresh token')
    
  }


}
)

const PasswordReset = asyncHandler( async ( req , res) =>{

   const { oldpassword, newpassword , confpassword } = req.body  

   if(!oldpassword || !newpassword || !confpassword){
     throw new ApiError(400,'All fields are required')
   }

   if(newpassword !== confpassword){
     throw new ApiError(400,'Password dont match Each Other')
   }

   const user = await User.findById( req.user?._id)
   
   const PasswordVaild = await user.isPasswordCorrect(oldpassword)

    if(!PasswordVaild){
      throw new ApiError(401,'password is incorrect')
    }

    user.password =newpassword
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},'Password reset successfully'))


})

const GetCurrentUser = asyncHandler( async ( req, res ) =>{

  return res
  .status(200)
  .json(new ApiResponse(200,req.user,'Current User Fetched sucessFully'))

})

const UpdateAccountdetails = asyncHandler( async(req,res) => {

  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, 'At least one field is required');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true },
  ).select('-password -refreshtoken');

  if (!user) {
    throw new ApiError(500, 'Error updating user details');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User details updated successfully'));


})

const UpdateUserAvatar = asyncHandler( async (req, res) =>{
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,'Avatar file path not found')
  }

  const Avatar = await uploadoncloudinary(avatarLocalPath)

  if(!Avatar || !Avatar.url){
    throw new ApiError(400,'Error uploading avatar to cloudinary')
  }

  const user = await User.findByIdAndUpdate(req.user._id,{
    $set : {
      avatar : Avatar.url
    }
  },).select('-password -refreshtoken')

  if(!user){
    throw new ApiError(500,'Error updating user avatar')
  }

  //delete old avatar from cloudinary
  if(user.avatar){
    const public_id = user.avatar.split('/').slice(-1)[0].split('.')[0]
    await cloudinary.uploader.destroy(public_id)
  }

  return res
  .status(200)
  .json(new ApiResponse(200,user,'User avatar updated successfully'))


})

const UpdateUserCoverImage = asyncHandler( async (req, res) =>{
  const CoverImageLocalPath = req.file?.path

  if(!CoverImageLocalPath){
    throw new ApiError(400,'Cover Image file path not found')
    // throw new ApiError(400,'Avatar file path not found')
  }

  const CoverImage = await uploadoncloudinary(CoverImageLocalPath)

  if(!CoverImage || !CoverImage.url){
    throw new ApiError(400,'Error uploading Cover Image to cloudinary')
  }

  const user = await User.findByIdAndUpdate(req.user._id,{
    $set : {
      coverimage : CoverImage.url
    }
  },).select('-password -refreshtoken')

  if(!user){
    throw new ApiError(500,'Error updating user Cover Image')
  }

  //delete old coverimage from cloudinary
  if(user.coverimage){
    const public_id = user.coverimage.split('/').slice(-1)[0].split('.')[0]
    await cloudinary.uploader.destroy(public_id)
  }


  return res
  .status(200)  
  .json(new ApiResponse(200,user,'User Cover Image updated successfully'))


})

const GetChannelProfile = asyncHandler( async (req , res) => {

  const { username } = req.params

  if(!username){
    throw new ApiError(400,'Channel  not found')
  }

  const Channel = await User.aggregate([
    {
      $match : {username}?.toLowerCase()
    },
    {
      $lookup :{
        from : 'subscriptions',
        localField : '_id',
        foreignField : 'channel',
        as : 'subscribers'
      }
    },
    {
      $lookup :{
        from : 'subscriptions',
        localField : '_id',
        foreignField : 'subscribers',
        as : 'SubscribedTO'
      } 
    },
    {
      $addFields :{
        subdscriberCount : {$size : '$subscribers'},
        subscribedTOCount : {$size : '$SubscribedTO'},
        isSubscribed : { $cond: [
           { $in: [req.user?._id, '$subscribers.subscribers'] },
            true,
            false 
          ] }
      }
    },
    {
      $project :{
        fullname : 1,
        username : 1,
        password : 0,
        refreshtoken : 0,
        subscribers : 0,
        SubscribedTO : 0,
        avatar : 1,
        coverimage : 1,
        subdscriberCount : 1,
        subscribedTOCount : 1,
        email : 1,
        isSubscribed : 1
      }
    }
  ])

  console.log('Channel:', Channel);

  if(!Channel?.length){
    throw new ApiError(404,'Channel not found')
  }

  return res
  .status(200)
  .json(new ApiResponse(200,Channel[0],'Channel fetched successfully'))

})

const GetWatchHistory = asyncHandler ( async ( req , res)=>{
  const user = await User.aggregate([
    {
      $match :{_id : new mongoose.Types.ObjectId(req.user._id)}  // not req.user._id becze `req.user._id` is a string and we need to convert it to ObjectId by using keyword new 
    },
    {
      $lookup : {
        from : 'videos',
        localField : 'watchHistory',
        foreignField : '_id',
        as : 'watchHistory',
        pipeline:[{
           $lookup :{
            from : 'users',
            localField : 'owner',
            foreignField : '_id',
            as : 'owner',
            pipeline :[{
              $project :{
                username : 1,
                fullname : 1,
                avatar : 1
              }
            }]
           }
      },{
        $addFields :{
          owner :{
            $first :"$owner"
          }
        }
      } ]
      }
    }
  ])

  if(!user?.length){
    throw new ApiError(404,'User not found')
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      'Watch history fetched successfully'
    )
  )
})

export { RegisterUser 
  , LoginUser,LogoutUser ,
   RefreshAccessToken , PasswordReset , GetCurrentUser 
   , UpdateAccountdetails, UpdateUserAvatar, UpdateUserCoverImage ,
    GetChannelProfile,GetWatchHistory}; 
