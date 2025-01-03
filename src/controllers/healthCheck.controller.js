import {asyncHandler} from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const healthCheck = asyncHandler(async(req, res)=>{
    try {
        res.status(200).json(new ApiResponse(200, null, "health check success"));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || "error during health check");
    }
})

export {healthCheck}