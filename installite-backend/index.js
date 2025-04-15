require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { s3 } = require('./utils/aws');
const { generateEmbedding } = require('./utils/embeddings');
const { storeUserEmbedding, getTopActorMatches } = require('./utils/chroma');
const { updateUserRecord, createStatusPost } = require('./utils/db');

const app = express();
app.use(express.json());

// Create temporary uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer Setup for File Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Endpoint: Upload Profile Image, Process Embedding, and Retrieve Top Actor Matches
app.post('/uploadProfileImage', upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId in request body" });

    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Generate embedding for the image (simulation)
    const embedding = await generateEmbedding(file.path);

    // Upload the image to S3
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

    // Delete the temporary local file
    fs.unlinkSync(file.path);

    // Update the user's record (simulated)
    await updateUserRecord(userId, { profileImageUrl: imageUrl });

    // Store the embedding in ChromaDB (simulation)
    await storeUserEmbedding(userId, embedding);

    // Query for top 5 actor matches (simulation)
    const topActors = await getTopActorMatches(embedding);

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

// Endpoint: Link a Selected Actor to a User
app.post('/linkActorToUser', async (req, res) => {
  try {
    const { userId, actorId } = req.body;
    if (!userId || !actorId) {
      return res.status(400).json({ error: "Missing userId or actorId" });
    }

    // Update user's record to link the actor (simulation)
    await updateUserRecord(userId, { linkedActorId: actorId });
    // Create a status post (simulation)
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