import asyncHandler from '../utils/asyncHandler.js';
import {User} from '../models/user.models.js';
import ApiError from '../utils/ApiError.js';
import uploadoncloudinary from '../utils/cloudinary.js';

const RegisterUser = asyncHandler( async(req, res) => {
   // get detils from front end 
   // validate the details
   // check if user already exists
   // check for image and avatar
   //upload to cloudinary
   // hash the password
   // remove password and refresh token  from the response
   // check user saved to db
   // return the user details
    const {username ,fullname, email ,password, avatar, coverimage } = req.body;
    
    if(!username || !fullname || !email || !password){
        res.status(400);
        throw new ApiError(400,"Please fill all fields")
    }

    // check if user already exists
    // if( user.findone({email}) ){
    //     res.status(400);
    //     throw new ApiError(400,"User already exists")
    // }
    const ExistedUser= User.findone({
        $or: [{email},{username}]
    })
     
    if(ExistedUser){
        res.status(400);
        throw new ApiError(400,"User already exists")
    }

    // check for image and avatar
    const avatarLocalPath= req.files?.avatar? req.files.avatar[0].path : null;
    const coverImageLocalpath =req.files?.coverimage? req.files.coverimage[0].path : null; 

    if(!avatarLocalPath){
        res.status(400);
        throw new ApiError(400,"Please upload an avatar")
    }

    //upload to cloudinary
    const Avatar = await uploadoncloudinary(avatarLocalPath)
    const Cover =await uploadoncloudinary(coverimageLocalpath)

    if(!Avatar){
        res.status(400);
        throw new ApiError(400,"Error in uploading avatar")
    }

    // enter to db
    const user= await User.create(
        {
            username: username.toLowercase(), 
            fullname,
            email,
            password,
            avatar: Avatar.url,
            coverimage: Cover.url? Cover.url : ""
        }
    )
    
    // remove password and refresh token  from the response
    const CreatedUser= await user.findbyId(user._id).select('-password -refreshtoken')

    return 

} )

export { RegisterUser }