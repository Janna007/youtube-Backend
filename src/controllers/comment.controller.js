import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId}=req.params

    if(!isValidObjectId(videoId)){
       throw new ApiError(400,"invalid video id")
    }

    const {content}=req.body
    if(!content){
        throw new ApiError(400,"Content is required")
    }

    const userId=req.user?._id

    if(!userId){
        throw new ApiError(400,"Unauthorised request")
    }

   const createComment= await  Comment.create({
         content,
         video:videoId,
         owner:userId
    })

    if(!createComment){
        throw new ApiError(500,"Something went wrong")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            createComment,
            "Add comment successfully"
        )
    )

    


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentId}=req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment id")
    }

    const {newContent}=req.body
    if(!newContent){
        throw new ApiError(400,"Content is required")
    }

   
    const oldComment=await Comment.findById(commentId)
   

    if(oldComment.owner.toString() != req.user?._id){
        throw new ApiError(400,"You cant update")
    }

    const updateComment= await Comment.findByIdAndUpdate(commentId,
        {
            $set:{
                content:newContent
            }
        },
        {
            new:true
        }
        )

        if(!updateComment){
            throw new ApiError(500,"something went wrong")
        }

        return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                updateComment,
                "Updated comment successfully"
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId}=req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid request")
    }

    const oldComment= await Comment.findById(commentId)

    if(!oldComment){
        throw new ApiError(400,"no comment found")
    }

    if(oldComment?.owner.toString() != req.user?._id){
        throw new ApiError(400,"You cant delete the comment")
    }

    await Comment.findByIdAndDelete(commentId)

    return res 
    .status(200)
    .json(
        new ApiResponse(
            200,
            "deleted comment successfully"
        )
    )


})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
