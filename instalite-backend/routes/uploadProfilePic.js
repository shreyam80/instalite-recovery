// instalite-backend/routes/uploadProfilePic.js

import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// --- Configure AWS SDK ---
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1"
});

const s3 = new AWS.S3();
const BUCKET = process.env.S3_BUCKET_NAME || "instalite";

// --- Configure multer-s3 middleware ---
const upload = multer({
  storage: multerS3({
    s3,
    bucket: BUCKET,
    acl: "public-read",
    key: (req, file, cb) => {
      const fileName = `user_images/${Date.now()}_${file.originalname}`;
      cb(null, fileName);
    }
  })
});

// --- POST /upload-profile-pic ---
router.post("/upload-profile-pic", upload.single("profileImage"), (req, res) => {
  if (!req.file || !req.file.location) {
    return res.status(400).json({ error: "Image upload failed." });
  }
  return res.json({ imageUrl: req.file.location });
});

export default router;
