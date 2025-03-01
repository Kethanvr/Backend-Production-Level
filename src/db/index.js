 import mongoose from "mongoose";
 import { db_name } from "../constants.js";

 const ConnectDB = async () => {
    try {
        const connectionInstant= await mongoose.connect(`${process.env.MONGO_URI}/${db_name}`);
        console.log("Connected to DB");   
        console.log(`Connected to DB: ${connectionInstant.connection.host}`);
        // console.log({connectionInstant});
    } catch (error) {
        console.log("Error in connecting to DB", error); 
        process.exit(1);     
    }
}
export default ConnectDB;