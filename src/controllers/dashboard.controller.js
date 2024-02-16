import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
     const userId=req.user?._id
     if(!userId){
        throw new ApiError(400,"user not found")
     }

     const channelstats=await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalVideos: { $sum: 1 }
            }
        }
     ])

//    const totalSubscribers = await Subscription.countDocuments({ channel: userId });
   const totalSubscribers= await Subscription.aggregate([
           { 
            $match:{
                channel:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id:null,
                totalSubscribers:{$sum:1}
            }
        }
     ])

     const totalLikes=await Like.countDocuments({
        video:{
            $in:await Video.find({owner:user?._id})
        }
    })


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {channelstats,
            totalLikes,
            totalSubscribers}
            ,"Fetched dashboard data successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId=req.user?._id
    if(!userId){
        throw new ApiError(400,"user not found")
     }

      const allVideos= await Video.find({owner:userId})

     return res
     .status(200)
     .json(
        new ApiResponse(
            200,
            {
                allVideos
            },
            "fetched all videos"
        )
     )


})

export {
    getChannelStats, 
    getChannelVideos
    }