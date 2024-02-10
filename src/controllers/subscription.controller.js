import mongoose, {isValidObjectId} from "mongoose" 
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid request")
    }

    const userId=req.user?._id
    if(!userId){
        throw new ApiError(400,"unauthorised request")
    }
    
   const alreadySubscribed=await Subscription.findOne({
       subscriber:userId,
       channel:channelId
    })

    if(alreadySubscribed){
       await Subscription.findByIdAndDelete(alreadySubscribed?._id)

       return res
       .status(200)
       .json(
          new ApiResponse(
            200,
            "Unsubscribed successfully"
          )
       )
    }


   const createSubscription=await Subscription.create({
        subscriber:userId,
        channel:channelId
    })

    if(!createSubscription){
        throw new ApiError(500,"something went wrong while creating document")
    }

    return res
    .status(200)
    .json(
       new ApiResponse(
         200,
         createSubscription,
         "subscribed successfully"
       )
    )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
   

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"invalid request")
    }

    const subscriberList= await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
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
            $unwind:"$subscriber"
        }
       
    ])

    if(!subscriberList.length){
        throw new ApiError(400,"not found any subscriber")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscriberList,
            "fetch subscriber list successfully"
        )
    )

})




// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const existedUser= await User.findById(subscriberId)
    if(!existedUser){
        throw new ApiError(400,"no user found")
    }

    const channelList=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
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
            $unwind:"$channel"
        }
    ])

    if(!channelList.length){
        throw new ApiError(400,"No channel to subscribe")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            channelList,
            "Fetch channel list successfully"
            )
    )
})



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}

