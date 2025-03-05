import dotenv from "dotenv";
import ConnectDB from "./db/index.js";
import app from "./app.js";
dotenv.config(
    { 
        path: "./env"
    }
);


ConnectDB().then(
 app.listen( process.env.PORT || 8000 
    , () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    }
 )).catch((error) => {
    console.log("Error in connecting to DB", error); 
    process.exit(1);     
})