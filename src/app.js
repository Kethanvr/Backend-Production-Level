import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(cors(
    {
        origin: process.env.CORSORIGIN,
        credentials: true
    }
))

app.use(express.json({limit:"16kb"}))
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.urlencoded({extended: true, limit:"16kb"}));

// Routes

import userRoutes from './routes/user.routes.js';

app.use('/api/v1/users', userRoutes);


export default app;