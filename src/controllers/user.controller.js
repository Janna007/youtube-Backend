import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'


const generateAccessAndRefreshTokens=async (userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=await user.generateAccessToken()
        const refreshToken=await user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something Went Wrong While Generating Refresh and Access Token")
    }
}

 const registerUser=asyncHandler(async (req,res,next)=>{
       const {fullname,email,username,password}=req.body
       console.log("email:",email)

    //    if (fullname==="") {
    //       throw new ApiError(404,"Fullname is required")
    //    }

    if ([fullname,email,username,password].some((field)=>field?.trim() === "")) {
        throw new ApiError(400,"All field is are  required!!!")
    }
     
     const existedUser= await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"Email and Username already exist")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

   if(!avatarLocalPath){
    throw new ApiError(400,"Avatar is required")
   }

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }

   const user= await  User.create({
        fullname,
        email,
        password,
        username: username.toLowerCase(),
        avatar:avatar.url ,
        coverImage:coverImage?.url || ""
    })
    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
   if(!createdUser){
    throw new ApiError(500,"Something Went Wrong")
   }

   
  
   return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
)


 })

 const loginUser=asyncHandler(async (req,res)=>{

     const {email,username,password}=req.body
     if (!username && !email) {
        throw new ApiError(400,"Username or Email is Required")
     }
     
     const user=await User.findOne({
        $or:[{email}, {username}]
     })
     if(!user){
        throw new ApiError(404,"User does not exist")
     }

     const isPasswordValid =await user.isPasswordCorrect(password)
      
     if(!isPasswordValid){
        throw new ApiError(401,"Password is incorrect")
     }


    const {accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id)

     const loggedInUser=await User.findById(user._id).select("-password  -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse ( 200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
        "User Logged In Successfully")
    )




 })


 const logoutUser=asyncHandler(async (req,res)=>{
     await  User.findByIdAndUpdate(
        req.user._id,
        {
          $set :{
            refreshToken:undefined
          }
        },
        {
            new:true
        }
      )

      const options={
        httpOnly:true,
        secure:true
         }

    return res
     .status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json(new ApiResponse(200,"User loggedout"))

    })


const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken){
     throw new ApiError(401,"Unauthorized Request")
   }

try {
    
         const decodedToken=  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
         const user= await User.findById(decodedToken?._id)
         if(!user){
            throw new ApiError(401,"Invalid refresh token")
         }
         
         if(incomingRefreshToken !== user?.refreshToken){
            throw new  ApiError(401,"Expired refersh token")
         }
         const options={
            httpOnly:true,
            secure:true
        }
    
    
       const {accessToken,refreshToken} =await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse
           ( 200,
            {
                user:user,accessToken,refreshToken
            },
            "refresh access and refershtoken successfully")
        )
    
} catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token")
}

})
 

const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user=await User.findById( req.user?._id) 
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res 
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )

})



const getCurrentUser=asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"User fetched successfully")
    )
})

const updateAccountDetails=asyncHandler(async (req,res)=>{
    const {fullname,email}=req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user=   User.findByIdAndUpdate (req.user?._id,
        {
            $set:
            {
                fullname,
                email
            }
        },
        {new:true}
    ).select("-password")
     

     return res
     .status(200)
     .json(
        new ApiResponse(
            200,user,"Account Details Updated Successfully"
        )
     )
})


const updateUserAvatar=asyncHandler(async (req,res)=>{
     const avatarLocalPath= req.file?.path
     if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
     }

     const avatar= await uploadOnCloudinary(avatarLocalPath)

     if(!avatar.url){
        throw new ApiError(400,"Error while uploading on cloudinary")
     }

     const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}).select("-password")


        return res
        .status(200)
        .json(
            new ApiResponse(
                200,user,"Update avatar successfully"
            )
        )
       


})


const updateUserCoverImage=asyncHandler(async (req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while Uploading on cloudinary")
    }

  const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,user,"Update cover image successfully"
            )
        )
        
})






 export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}