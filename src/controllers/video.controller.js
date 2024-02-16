import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"



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

   const video= await Video.aggregate([
    {
        $match:{
            _id:new mongoose.Types.ObjectId(videoId)
        }

    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {
                    $project:{
                        username:1,
                        fullname:1,
                        avatar:1
                    }
                }
            ]
        }
    },
    {
        $addFields:{
            owner:{
                $first:"$owner"
            }
        }
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"video",
            as:"likes",
            pipeline:[
                {
                    $group:{
                        _id:null,
                        totalLikes:{$sum:1}
                    }
                },


            ]
            
        }
    },
    {
        $addFields:{
            likes:{
                $first:"$likes"
            }
        }
    }
   
   ])

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

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
     if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid request")
     }

     const {title,description}=req.body

     if(!title || !description){
        throw new ApiError(400,"Details are required")
     }

     const thumbnailLocalPath=req.file?.path

     if(!thumbnailLocalPath){
        throw new ApiError(500,"failed thumbnail upload on local server")
     }

     const thumbnailpath=await uploadOnCloudinary(thumbnailLocalPath)

     if(!thumbnailpath){
        throw new ApiError(500,"upload on cloudinary failed")
     }

     const updatedVideo=await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                title,
                description,
                thumbnail:thumbnailpath.url
            }
        },
        {
            new:true
        })


        return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Update video successfully"
            )

        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid request")
    }

    
    const oldVideo = await Video.findById(videoId)
    if (!oldVideo) {
        throw new ApiError(401, "Video not found")
    }
    const videoPublicId = oldVideo?.videoFile.public_id
    const thumbnailPulicId = oldVideo?.thumbnail.public_id

    const deletingVideoFromCloudinary = await deleteFromCloudinary(videoPublicId, "video")
    const deletingThumbnailFromCloudinary = await deleteFromCloudinary(thumbnailPulicId, "image")

    if (!deletingVideoFromCloudinary || !deletingThumbnailFromCloudinary) {
        throw new ApiError(400, "error while deleting files from cloudinary")
    }

   const deleteVideo= await Video.findByIdAndDelete(videoId)

   if(!deleteVideo){
    throw new ApiError(500,"something went wrong when deleting video")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        "Deleted video successfully"
    )
    
   )

    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid request")
    }

   const video= await Video.findById(videoId)
   if(!video){
    throw new ApiError(400,"Video not found")
   }
   const toggleVideoStatus = await Video.findByIdAndUpdate(
    videoId,
    {
        $set: {
            isPublished: !currentVideo?.isPublished
        }
    },
    {new: true}
)

return res
.status(200)
.json(
    new ApiResponse(
        200, 
        "Video Status toggled successfully",
         {isPublished: toggleVideoStatus.isPublished}
         )
         )


})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}





