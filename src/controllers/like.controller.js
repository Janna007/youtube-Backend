import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"

import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

     //TODO: toggle like on video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid request")
    }
    const userId=req.user._id
    
    if(!userId){
        throw new ApiError(400,"unauthorised request")
    }

    const likedVideoAlready=await Like.findOne({
        video:videoId,
        likedBy:userId
    })

    if(likedVideoAlready){
        await Like.findByIdAndDelete(likedVideoAlready?._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Unlike successfully"
            )
        )
    }
       
    
    const likedVideo= await Like.create({
            video:videoId,
            likedBy:userId
        })

        if(!likedVideo){
            throw new ApiError(500,"Something went wrong while creating document")
        }

        return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideo,
                "Like video successfully"
            )
        )
    

   

   
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid request")
    }

    const userId=req.user?._id
    if(!userId){
        throw new ApiError(400,"Unauthorised request")
    }

    const likedCommentAlready=await Like.findOne({
        comments:commentId,
        likedBy:userId
    })

    if(likedCommentAlready){
        await Like.findByIdAndDelete(likedCommentAlready._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Unlike comment successfully"
            )
        )
    }

    const likedComment=await Like.create({
        comments:commentId,
        likedBy:userId
    })

    if(!likedComment){
        throw new ApiError(500,"Something went wrong")
    }

    return res
    .status(200)
    .json(
     new ApiResponse(
         200,
         likedComment,
         "Like comment successfully"
     )
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid request")
    }

    const userId=req.user?._id
    if(!userId){
        throw new ApiError(400,"unauthorised request")
    }

   const likedTweetAlready=await Like.findOne({
      tweet:tweetId,
      likedBy:userId
   })

   if(likedTweetAlready){
      await Like.findByIdAndDelete(likedTweetAlready?._id)

      return res
      .status(200)
      .json(
        new ApiResponse(
            200,
            "Unlike tweet successfully"
        )
      )
   }


   const likedTweet=await Like.create({
     tweet:tweetId,
     likedBy:userId
   })

   if(!likedTweet){
    throw new ApiError(500,"Something wrong while creating document")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        likedTweet,
        "Like tweet successfully"
    )
   )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId=req.user?._id

    const likedVideos=await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $match:{
                video:{$exists:true}
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video",
                pipeline:[
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
                        $project:{
                            videoFile:1,
                            thumbnail:1,
                            title:1,
                            description:1,
                            views:1,
                            owner:1
                        }
                    }
                   
                ]
            }
        },
        {
            $addFields: {
                videoCount: {
                    $size: "$video"
                }
            }
        },
        
       
    ])


    return res 
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            "Fetch liked videos suucesfully"

        )
    )

})

export {
    
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getLikedVideos

   
}