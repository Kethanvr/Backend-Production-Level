import { Router } from "express";
import { RegisterUser } from "../controllers/user.controllers.js";
import upload from '../middlewares/upload.js';
const router = Router();

router.route('/register').post(
    upload(
        [
            {
                name: 'avatar',
                maxCount: 1
            },
            {
                name: 'coverimage',
                maxCount: 1
            }
        ]
    ),
    RegisterUser);

export default router