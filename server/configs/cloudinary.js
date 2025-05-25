import {v2 as cloudinary} from "cloudinary"

const connectcCloudinary = async ()=> {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:process.env.CLOUDINARY_API_NAME,
        api_secret:process.env.CLOUDINARY_API_SECRET,
    })
}
export default connectcCloudinary; 