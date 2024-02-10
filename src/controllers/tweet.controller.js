import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const{content}=req.body

    if(!content){
        throw new ApiError(400,"Content is required")
    }


    const tweet=await Tweet.create({
         content,
         owner:req.user._id
    })


    if(!tweet){
        throw new ApiError(500,"Something went wrong while creating tweet")
    }

     const createdTweet= await Tweet.findById(tweet._id)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            createdTweet,
            "tweet created successfully"
        )
    )


})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const {userId}=req.params
    if(!userId){
        throw new ApiError(400,"User not found")
    }
  
    const tweets=await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
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
                            avatar:1
                        }
                    },
                    
                ]
            },

        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        }
    ])

    if (!tweets?.length) {
        throw new ApiError(404, "tweets does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "tweet created successfully"
        )
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {tweetId}=req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweetid is not valid")
    }
    const {newContent}=req.body

    if(!newContent){
        throw new ApiError(400,"Content is ruquired")

    }

    // const tweet=await Tweet.findById(tweetId)

    // if(!tweet){
    //     throw new ApiError(400,"Tweet is not found")
    // }

    // tweet.content=newContent

    // await tweet.save()

   const updatedTweet= await Tweet.findByIdAndUpdate(tweetId,
         {
            $set:{
                content:newContent
            }
         },
         {
           new:true
         }

        )

        if(!updateTweet){
            throw new ApiError(500,"Something went wrong while updating tweet")
        }

    return res
    .status(200)
    .json(
        new ApiResponse
       ( 200,
        updatedTweet,
        "Update tweet successfully")
    )


})


const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const {tweetId}=req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweetid is not valid")}

    await Tweet.findByIdAndDelete(tweetId)

return res
.status(200)
.json(
    new ApiResponse(
        200,
        {},
        "Delete tweet successfully"
    )
)
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
    
}