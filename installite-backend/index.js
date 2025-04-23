import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Utilities
import { s3 } from './utils/aws.js';
import { generateEmbedding } from './utils/embeddings.js';
import { storeUserEmbedding, getTopActorMatches } from './utils/vector.js';
import { updateUserRecord, createStatusPost } from './utils/db.js';

console.log("→ Using S3 bucket:", process.env.S3_BUCKET);
if (!process.env.S3_BUCKET) {
  console.error("❌ Missing S3_BUCKET env var—set that in your .env!");
  process.exit(1);
}

// __dirname workaround for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Ensure the uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Endpoint: Upload Profile Image and Process Embedding/Matching
app.post('/uploadProfileImage', upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // 1) generate the embedding
    const embedding = await generateEmbedding(file.path);

    // 2) upload to S3
    const ext = path.extname(file.originalname);
    const bucketName = process.env.S3_BUCKET;
    const s3Key = `profile_photos/${userId}-${Date.now()}${ext}`;
    const fileStream = fs.createReadStream(file.path);
    const s3Params = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileStream,
      ContentType: file.mimetype,
    };
    await s3.upload(s3Params).promise();

    // ——————————————
    // ** INSERT THIS RIGHT HERE **
    // build your own URL (no bucket policy / CORS changes needed)
    const imageUrl = await new Promise((resolve, reject) =>
      s3.getSignedUrl('getObject',
        { Bucket: process.env.S3_BUCKET, Key: s3Key, Expires: 3600 },
        (err, url) => err ? reject(err) : resolve(url)
      )
    );
    console.log('Signed URL for download:', imageUrl);
    // ——————————————

    // 3) clean up local file
    fs.unlinkSync(file.path);

    // 4) persist in your “DB”
    await updateUserRecord(userId, { profileImageUrl: imageUrl });
    // await storeUserEmbedding(userId, embedding);

    // 5) similarity search
    const actorMatches = await getTopActorMatches(embedding);

    return res.json({ success: true, imageUrl, actorMatches });
  } catch (err) {
    console.error('Error in /uploadProfileImage:', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// Endpoint: Link Selected Actor to User
app.post('/linkActorToUser', async (req, res) => {
  try {
    const { userId, actorId } = req.body;
    if (!userId || !actorId) return res.status(400).json({ error: 'Missing userId or actorId' });

    await updateUserRecord(userId, { linkedActorId: actorId });
    await createStatusPost(userId, `User ${userId} is now linked to actor ${actorId}`);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error in /linkActorToUser:', err);
    return res.status(500).json({ error: 'Failed to link actor' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));