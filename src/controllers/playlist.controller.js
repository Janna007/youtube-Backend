import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
   //TODO: create playlist

   if(!name || !description){ 
      throw new ApiError(400,"name and description required for creating playlist")
   }

   const createdPlaylist=await Playlist.create({
    name,
    description,
    owner:req.user?._id
   })

   if(!createdPlaylist){
    throw new ApiError(500,"Something went wrong ,cant create document")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        createdPlaylist,
        "Create playlist succesfully"
    )
   )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"invalid request")
    }

    const userPlaylist=await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
                pipeline:[
                    {
                        $project:{
                            _id:1,
                            thumbnail:1,
                            title:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                videoCount:{
                    $size:"$videos"
                }
            }
        }
    ])

    if(!userPlaylist.length){
         return res
        .status(200)
        .json(
            new ApiResponse(
               200,
               "not created any playlist yet"
            )
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse
        (200,
        userPlaylist,
        "fetch userplaylist seccessfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid request")
    }

    const playlist=await Playlist.aggregate([
          {
            $match:{
                _id:new mongoose.Types.ObjectId(playlistId)
            }
          },
          {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
          },
          {
            $addFields:{
                videoCount:{
                    $size:"$videos"
                }
            }
          }
    ])

    if(!playlist){
        throw new ApiError(500,"something went wrong")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Fetch playlist succesfully"
        )
    )


})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    //add video to a playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlist")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video")
    }

   const playlist=await Playlist.findById(playlistId)

   if(!playlist){
    throw new ApiError(400,"playlist not found")
   }

   if(playlist.owner?.toString() != req.user?._id){
    throw new ApiError(400,"only owner can add videos to playlist")
   }




// const addVideo=await Playlist.aggregate([
//     {
//         $match:{
//             _id:new mongoose.Types.ObjectId(playlistId)
//         }
//     },
//     {
//         $addFields:{
//             videos:{
//                 $concatArrays:["$videos",[videoId]]
//             }
//         }
//     }
// ])


const addVideo=await Playlist.findByIdAndUpdate(playlistId,
    {
        $push:{

             videos:videoId
             }
    },
    {
        new:true
    }
    )

   if(!addVideo){
    throw new ApiError(400,"cant add video to playlist")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(
        200,
        addVideo,
        "Add video successfully"
    )
   )


})



const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid playlist")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video")
    }

   const playlist=await Playlist.findById(playlistId)

   if(!playlist){
    throw new ApiError(400,"playlist not found")
   }

   if(playlist.owner?.toString() != req.user?._id){
    throw new ApiError(400,"only owner can remove videos from playlist")
   }
   const deletedVideo=await Playlist.findByIdAndUpdate(playlistId,
        {
             $pull:{
                videos:videoId
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
        deletedVideo,
        "delete video"
    )
  )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid request")
    }

    const playlist=await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    if(playlist.owner?.toString() != req.user?._id){
        throw new ApiError(400,"only owner can delete playlist")

     }

  const deletedplaylist= await Playlist.findByIdAndDelete(playlistId)

  if(!deletedplaylist){
    throw new ApiError(400,"Something went wrong while deleting playlist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
        200,
        "delete playlist successfully"
    )
  )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"invalid request")
    }

    if(!name || !description){
        throw new ApiError(400,"name and description is required")
    }

    const playlist=await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    if(playlist.owner?.toString() != req.user?._id){
        throw new ApiError(400,"only owner can update playlist")

     }
    const updatedPlaylist=await Playlist.findByIdAndUpdate(playlistId,
        {
            $set:{
                 name:name,
                 description:description
            }
        },
        {new:true})

        if(!updatedPlaylist){
            throw new ApiError(500,"something went wrong while updating playlist")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Updated playlist successfully"
            )
        )
})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
