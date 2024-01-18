import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'


 const registerUser=asyncHandler(async (req,res,next)=>{
       const {fullname,email,username,password}=req.body
       console.log("email:",email)

    //    if (fullname==="") {
    //       throw new ApiError(404,"Fullname is required")
    //    }

    if ([fullname,email,username,password].some((field)=>field?.trim() === "")) {
        throw new ApiError(400,"All field is are  required!!!")
    }
 })

 export {registerUser}