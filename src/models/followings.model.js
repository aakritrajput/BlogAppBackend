import mongoose,  {Schema} from "mongoose";

const followingSchema = new Schema({
    followerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    bloggerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true})

export const Following = mongoose.model("Following", followingSchema)