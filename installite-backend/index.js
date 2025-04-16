// index.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import utility modules
const { s3 } = require('./utils/aws');
const { generateEmbedding } = require('./utils/embeddings');
const { storeUserEmbedding, getTopActorMatches } = require('./utils/vector');
const { updateUserRecord, createStatusPost } = require('./utils/db');

const app = express();
app.use(express.json());

// Ensure the uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Endpoint: Upload Profile Image and Process Embedding/Matching
app.post('/uploadProfileImage', upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId in request body" });

    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Generate the image embedding (simulate or integrate your model here)
    const embedding = await generateEmbedding(file.path);

    // Upload image to AWS S3
    const fileExtension = path.extname(file.originalname);
    const s3Key = `profile_photos/${userId}-${Date.now()}${fileExtension}`;
    const fileStream = fs.createReadStream(file.path);

    const s3Params = {
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Body: fileStream,
      ACL: 'public-read',
      ContentType: file.mimetype
    };

    const s3Response = await s3.upload(s3Params).promise();
    const imageUrl = s3Response.Location;
    console.log('Image uploaded to S3:', imageUrl);

    // Delete temporary file
    fs.unlinkSync(file.path);

    // Update the user's record with the new image URL
    await updateUserRecord(userId, { profileImageUrl: imageUrl });

    // Store the embedding in your vector DB (ChromaDB)
    await storeUserEmbedding(userId, embedding);

    // Query vector DB for the top 5 actor matches
    const topActors = await getTopActorMatches(embedding);

    // Return the image URL and top actor matches to the frontend
    res.json({
      success: true,
      imageUrl,
      actorMatches: topActors
    });
  } catch (error) {
    console.error("Error in /uploadProfileImage:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

// Endpoint: Link Selected Actor to User
app.post('/linkActorToUser', async (req, res) => {
  try {
    const { userId, actorId } = req.body;
    if (!userId || !actorId) {
      return res.status(400).json({ error: "Missing userId or actorId" });
    }

    // Update the user's record to link the selected actor (simulated)
    await updateUserRecord(userId, { linkedActorId: actorId });
    // Create an automatic status post (simulated)
    await createStatusPost(userId, `User ${userId} is now linked to actor ${actorId}`);

    res.json({ success: true });
  } catch (error) {
    console.error("Error in /linkActorToUser:", error);
    res.status(500).json({ error: "Failed to link actor" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});