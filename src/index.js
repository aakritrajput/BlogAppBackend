import dotenv from "dotenv";
import {app} from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env'
})

connectDB().then(()=>{
    app.on("error", (error)=> {
        console.log("ERROR:", error)
        throw error
    })
    app.listen(process.env.PORT || 5000, ()=> {
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
}).catch((error)=> {
    console.log("MONGO db connection failed!!! ", error)
})
