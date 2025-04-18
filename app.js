import express from 'express';
import pkg from 'kafkajs';
const { Kafka, CompressionTypes, CompressionCodecs } = pkg;
import SnappyCodec from 'kafkajs-snappy';
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;
import { saveKafkaPost } from "./server/kafka/kafka_db.js";

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
                    postToSave = {
                        username: parsed.author?.displayName || "bluesky-user",
                        avatar: parsed.author?.avatar || null,
                        post_text: parsed.text,
                        hashtags: parsed.text.match(/#[\w]+/g) || [],
                        external: true
                    };
                } else {
                    postToSave = {
                        ...parsed,
                        external: true
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
