import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit: "50kb"}))
app.use(express.urlencoded({extended: true, limit: "25kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// importing routes
import userRoute from "./routes/user.routes.js"
import blogRoute from "./routes/blog.routes.js"
import followingsRoute from "./routes/followings.routes.js"

// decalaring routes 
app.use("/api/v1/user", userRoute)
app.use("/api/v1/blog", blogRoute)
app.use("/api/v1/followings", followingsRoute)

//  http://localhost:5000/api/v1/user
export {app}