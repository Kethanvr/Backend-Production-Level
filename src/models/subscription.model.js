import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscribers :{
        type : mongoose.Schema.Types.ObjectId, //one who is subscribing
        ref : 'User',
    },
    channel: {
        type : mongoose.Schema.Types.ObjectId, //one who is being subscribed
        ref : 'User',
    }
}
    ,{
        timestamps: true
    }
)


export const subscription = mongoose.model('subscription', subscriptionSchema);