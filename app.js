import express from 'express';
import pkg from 'kafkajs';
const { Kafka, CompressionTypes, CompressionCodecs } = pkg;
import SnappyCodec from 'kafkajs-snappy';
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;
import { saveKafkaPost } from "./kafka_db.js";

import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const app = express();
const kafka = new Kafka({
    clientId: 'g01-kafka-client',
    brokers: config.bootstrapServers
});

const consumer = kafka.consumer({ groupId: config.groupId });
let kafka_messages = [];


// Helper: extract hashtags from post text
function extractHashtags(text) {
    return (text.match(/#[\w]+/g) || []).map(tag => tag.slice(1).toLowerCase());
}

app.get('/', (req, res) => {
    res.send(JSON.stringify(kafka_messages));
});

// START CONSUMER
const run = async () => {
    await consumer.connect();

    for (const topic of config.topics) {
        console.log(`Subscribing to ${topic}`);
        await consumer.subscribe({
            topic,
            fromBeginning: true,
            compression: CompressionTypes.Snappy
        });
    }

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const raw = message.value.toString();
            kafka_messages.push({ topic, value: raw });

            try {
                const parsed = JSON.parse(raw);

                let postToSave;

                if (topic === "Bluesky-Kafka") {
                    // 🔄 Username normalization (Spec: create dummy/proxy user IDs)
                    const normalizedUsername = `bluesky_${parsed.author?.displayName.replace(/\s+/g, "_").toLowerCase() || "user"}`;

                    // 🏷 Hashtag extraction (Spec: hashtags could be inside post text)
                    const hashtags = extractHashtags(parsed.text);

                    postToSave = {
                        username: normalizedUsername,
                        avatar: parsed.author?.avatar || null,
                        post_text: parsed.text,
                        hashtags,
                        external: true,
                        source_site: 'bluesky',
                        post_uuid_within_site: parsed.uri || null,
                        created_at: parsed.created_at || new Date()
                    };
                } else {
                    // FederatedPosts (Spec: reuse backend logic but use proxy IDs)
                    const normalizedUsername = `federated_${parsed.username.toLowerCase()}`;
                    const hashtags = extractHashtags(parsed.post_text);
                    postToSave = {
                        ...parsed,
                        username: normalizedUsername,
                        hashtags,
                        external: true,
                        created_at: new Date() // Optional — overwrite if needed
                    };
                }

                console.log(`[${topic}]`, postToSave);

                // TODO: Replace this with actual DB logic
                //await saveKafkaPost(postToSave);

            } catch (err) {
                console.error("Error parsing Kafka message:", err);
            }
        }
    });
};

run().catch(console.error);
app.listen(config.port, () => {
    console.log(`App is listening on port ${config.port}`);
});
