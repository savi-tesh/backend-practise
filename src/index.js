import dotenv from "dotenv";
dotenv.config({
    path:'./env'
})
import connectDB from "./db/index.js";
import { app } from "./app.js";




connectDB();

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`)});








/*
(async()=>{
    try{
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       app.on("error",(error)=>{
           console.log("Connection error");
           process.exit(1);
       })
       app.listen(process.env.PORT,()=>{
           console.log(`Server is running on port ${process.env.PORT}`);
       }  );
        
    }catch(error){
        console.error(error);
    

    }
})()

*/