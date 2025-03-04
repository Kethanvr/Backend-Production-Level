import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema = new Schema({
    videofile:{
        type:String,
        required:true
    },
    thumbanail:{
        typr:String,
        required:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    duration:{
        type:Number,
        required:true
    },
    views:{
        type:Number,
        default:0,
    },
    isPublished:{
        type:Boolean,
        default:true    
    }
},
{
    timestamps:true
}
)

VideoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video',VideoSchema)