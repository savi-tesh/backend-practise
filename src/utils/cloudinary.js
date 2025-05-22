import {v2 as cloudinary} from "cloudinary";
import fs from "fs";



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary= async(localfilepath)=>{
    try{
        if(!localfilepath){
            return null;
        }
        //upload on cloudinary
        const response=await cloudinary.uploader.upload(localfilepath,{
            resource_type: "auto"   
             })
             //file uploaded successfully
            console.log("File uploaded successfully on cloudinary", response.url);
            return response;

    }catch(error){
        fs.unlinkSync(localfilepath); //remove the locally saved file in case of uploadf failure
        console.error("Error uploading file to cloudinary", error);

    }
}

export {uploadOnCloudinary};