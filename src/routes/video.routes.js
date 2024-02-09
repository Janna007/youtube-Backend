import { Router } from 'express';
import {upload }from '../middlewares/multer.middleware.js'
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { getVideoById, publishVideo } from '../controllers/video.controller.js';


const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
           name:"thumbnail",
           maxCount:1
        }
    ]),
    publishVideo)

    router.route("/:videoId").get(getVideoById)



export default router