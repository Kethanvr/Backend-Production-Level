import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
export const verityJWT = asyncHandler( async (req, _, next) => {

   try {
     const token = req.cookies.accessToken || req.headers("Authorization")?.replace("Bearer","")
 
     if(!token){
         throw new ApiError(401,'Unauthorised Request')
     }
 
     const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decoded._id).select("-password -refreshtoken")
 
     if(!user){
         throw new ApiError(401,'User not found')
     }
     req.user=user;
     next();
   } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorised Request")
   }
})