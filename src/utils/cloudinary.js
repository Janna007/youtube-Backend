import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import { basename } from 'path';

  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
})

const uploadOnCloudinary=async (localFilePAth)=>{
  try {
    if(!localFilePAth) return null ;

    //upload files on cloudinary

   const response= await  cloudinary.uploader.upload(localFilePAth,{
      resource_type:'auto'
    })
    //file has been uploaded successfully
    console.log("file uploaded"  ,response.url)
  } catch (error) {
    fs.unlinkSync(localFilePAth)   //remove  locally saved  file from our server
    return null
  }
}


export {uploadOnCloudinary}