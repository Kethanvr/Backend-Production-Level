import mongoose, { Schema } from 'mongoose';
import bycrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String, //cloudinary url
      requied: true,
    },
    coverimage: {
      type: String, //cloudinary url
    },
    password: {
      type: String,
      requied: [true, 'Password is required'],
      minlength: 6,
    },
    refreshtoken: {
      type: String,
    },
    watchhistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'video',
      },
    ],
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  try {
    const salt = await bycrypt.genSalt(10);
    this.password = await bycrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
// userSchema.pre('save', async function (next){
//     if(!this.modified('password')){
//         next()
//     }else{
//     this.password= bycrypt.hash(this.password,10)
//     next()
//     }
// })

userSchema.methods.isPasswordCorrect = async function (password){
     return await bycrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign(
    {
        _id : this._id,
        username :this.username,
        email : this.email,
        fullname : this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn : process.env.ACCESS_TOKEN_EXPIRES_IN
    }
    )
}
userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id : this._id,
            username :this.username,
            email : this.email,
            fullname : this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,{
            expiresIn : process.env.REFRESH_TOKEN_EXPIRES_IN
        }
    )
}

export const User = mongoose.model('User', userSchema);
