import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary using environment variables
// Set these in BE/.env (or project root .env loaded by your server):
// CLOUDINARY_CLOUD_NAME=xxxx
// CLOUDINARY_API_KEY=xxxx
// CLOUDINARY_API_SECRET=xxxx
// Optionally: CLOUDINARY_SECURE=true

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: process.env.CLOUDINARY_SECURE !== "false",
});

export default cloudinary;


