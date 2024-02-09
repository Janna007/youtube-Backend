import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'



const publishVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || !description){
        throw new ApiError(400,"All fields are required")
    }
    const videoLocalPath=req.files?.videoFile[0]?.path
    const thumbnailLocalPath=req.files?.thumbnail[0]?.path

    if(! videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(400,"Video Uploading failed")
    }

    const videopath= await uploadOnCloudinary(videoLocalPath)
    const thumbnailpath=await uploadOnCloudinary(thumbnailLocalPath)

    

    if(!videopath || !thumbnailpath){
        throw new ApiError(500,"Uploading on cloudinary is failed")
    }

   const publishVideo= await Video.create({
        videoFile:videopath.url,
        thumbnail:thumbnailpath.url,
        title,
        description,
        duration:videopath.duration,
        owner:req.user._id
     })

    //  console.log("Created")


    if(!publishVideo){
        throw new ApiError(500,"Something Went wrong while creating document")
    }
    const publishedVideo=await Video.findById(publishVideo._id)


    return res 
    .status(200)
    .json(
        new ApiResponse(
            200,
            publishedVideo,
            "Upload video successfully"
        )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid request")
    }

   const video= await Video.findById(videoId)

   if(!video){
    throw new ApiError(400,"Video is not found")
   }

   return res 
   .status(200)
   .json(
    new ApiResponse(
        200,
        video,
        "gei video successfully"
    )
   )
})




export {
    publishVideo,
    getVideoById
   }
