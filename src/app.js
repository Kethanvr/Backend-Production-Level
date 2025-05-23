import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(
  cors({
    origin: process.env.CORSORIGIN,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());

// Routes

import userRoutes from './routes/user.routes.js';

app.use('/api/v1/users', userRoutes);

export default app;
