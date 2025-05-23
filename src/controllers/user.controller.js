import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAcessAndRefreshTokens=async(userId)=>{
  try{
    const user=await User.findById(userId);
    const accessToken=user.generateAccessToken();
    const refreshToken=user.generateRefreshToken();
    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave: false})
    return {accessToken,refreshToken}

  }catch(error){
    throw new ApiError(500, "something went wrong while generating refresh and access token")

  }
}


const registerUser=asyncHandler(async(req,res)=>{
    const {fullName,email,password,username}=req.body;
    console.log("email",email);
    if([fullName,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError("All fields are required",400)
    }
   const existedUser= await User.findOne({
        $or:[{email},{username}]
    })
    if(existedUser){
        throw new ApiError("Email or username already exists",409)
    }
    const avatarLocalPath= req.files?.avatar[0]?.path;
    const coverImageLocalPath= req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError("Please provide an avatar image",400)
    }
   const avatar= await uploadOnCloudinary(avatarLocalPath)
   const coverImage= await uploadOnCloudinary(coverImageLocalPath)
   if(!avatar){
       throw new ApiError("Error uploading avatar image",500)
   }

  const user=await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()

   })
  const createdUser= await User.findById(user._id).select("-password -refreshToken")
  if(!createdUser){
    throw new ApiError("Error while creating user",500)
  }
  return res.status(201).json(
    new ApiResponse("User registered successfully", 200, createdUser)
  )



})
//signin logic

const loginUser=asyncHandler(async(req,res)=>{
   const{email, username, password}=req.body;
   if(!(username || email)){
    throw new ApiError(400, "username or email is required")
   }
  const user= await User.findOne({$or:[{username},{email}]})

  if(!user){
    throw new ApiError(404,"User does not exsist")
  }
 const isPasswordValid= await user.isPasswordCorrect(password)
 if(!isPasswordValid){
  throw new ApiError(401,"invalid user credentials")
 }
 const {accessToken,refreshToken}=await generateAcessAndRefreshTokens(user._id);

 const loggedInUser= await User.findById(user._id).select("-password -refreshToken")
 const options={
  httpOnly:true,
  secure:true
 }
 return res
 .status(200)
 .cookie("accessToken",accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
  new ApiResponse(
    200,
    {
      user:loggedInUser,accessToken,refreshToken
    },
    "user logged in successfully"
  )
  
 )

})

const logoutUser=asyncHandler(async(req,res)=>{
       await User.findByIdAndUpdate(req.user._id,
        {
          $set:{
            refreshToken:undefined
          }
        },
        {
          new:true
        }
      )
      const options={
  httpOnly:true,
  secure:true
      }
      return res.status(200)
      .clearCookie("accessToken",options)
      .clearCookie("refreshToken",options)
      .json(new ApiResponse(200,{},"user logged Out"))
})



const refreshAcessToken = asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken ||req.body.refreshToken;
  if(!incomingRefreshToken){
    throw new ApiError(500, "Unauthorized request")
  }
 try {
  const decodedToken= await jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
     )
     const user=User.findById(decodedToken?._id)
      if(!user){
     throw new ApiError(500, "Invalid refresh token")
   }
   if(incomingRefreshToken !==user?.refreshToken){
     throw new ApiError(401,"Refresh token is expired or used")
   }
   const option={
     httpOnly:true,
     secure:true
   }
   const {accessToken,newrefreshToken}=await generateAcessAndRefreshTokens(user._id)
   return res
   .status(200)
   .cookie("accessToken",accessToken,option)
   .cookie("newrefreshToken",newrefreshToken,option)
   .json(
     new ApiResponse(
       200,
       {
         accessToken,refreshToken:newrefreshToken
       },
       "Access token refreshed"
     )
   )
 } catch (error) {
  throw new ApiError(401,"unauthorised refreshtoken")
  
 }
})





export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAcessToken
}