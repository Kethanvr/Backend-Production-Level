import mongoose, {Schema} from "mongoose";

const LikeSchema = new Schema({
     
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comment",
        required:true
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video",
        required:true
    },
    likedby:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    tweet:{
        type:String,
        required:true
    }
},{
    timestamps:true
})



export const Like = mongoose.model('Like',LikeSchema)