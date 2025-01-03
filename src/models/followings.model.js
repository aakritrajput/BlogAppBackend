import mongoose,  {Schema} from "mongoose";

const followingSchema = new Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    blogger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true})

export const Following = mongoose.model("Following", followingSchema)