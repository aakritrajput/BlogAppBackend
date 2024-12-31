import cookieParser from "cookie-parser";
import express from "express";

const app = express()

app.use(express.json({limit: "50kb"}))
app.use(express.urlencoded({extended: true, limit: "25kb"}))
app.use(express.static("public"))
app.use(cookieParser())

export {app}