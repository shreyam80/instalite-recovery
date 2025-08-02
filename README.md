# InstaLite

InstaLite is a full-stack, Instagram-inspired social media platform built to simulate distributed systems at scale. Developed by a team of four, InstaLite supports real-time content ingestion via Kafka, personalized feed ranking via Apache Spark, and intelligent search through vector embeddings and LangChain. The system integrates cloud infrastructure, streaming data, and large language models to offer a dynamic and scalable user experience.

## Features

- Posts, comments, hashtags, and image uploads
- Real-time post ingestion from federated sources using Kafka
- Personalized feed ranking using the Adsorption algorithm in Apache Spark
- Actor-based profile matching with vector embeddings
- Real-time chat with WebSockets and persistent group chat history
- Natural language chatbot powered by LangChain + ChromaDB
- React frontend and RESTful API backend
- AWS-hosted MySQL and S3 image storage

## Tech Stack

| Layer              | Technologies                          |
|-------------------|---------------------------------------|
| Frontend          | React, Socket.io                      |
| Backend           | Node.js, Express, Kafka, Spark        |
| Database          | MySQL (AWS RDS), ChromaDB             |
| AI/Search         | LangChain, OpenAI GPT-4, ChromaDB     |
| Storage           | AWS S3 (for user profile images)      |
| DevOps            | Docker, GitHub, AWS EC2               |

## My Contributions

As a core contributor to the project, I focused on the **streaming infrastructure**, **ranking algorithm**, and **frontend-feed integration**:

### Kafka Integration
- Subscribed to two real-time Kafka topics: `FederatedPosts` and `Bluesky-Kafka`.
- Built a Kafka **consumer** to ingest external posts into our system, normalizing usernames and preventing duplicates.
- Developed a Kafka **producer** for testing ingestion pipelines.
- Handled schema mismatches, backpressure, and message filtering using buffer control and wrapper logic.

### Spark Adsorption Job
- Constructed an hourly **Spark job** that runs the Adsorption algorithm to rank posts for every user.
- Modeled users, posts, and hashtags as nodes in a graph with weighted edges based on interactions.
- Implemented label propagation with restart probability (`alpha = 0.85`) to ensure relevance and convergence.
- Added safeguards against label mass loss and ensured synthetic users were added for all external post authors.

### Feed and Frontend Integration
- Integrated feed ranking output into the frontend via REST endpoints and MySQL ranking queries.
- Added graceful fallback to chronological post list when no ranked feed was available.
- Helped debug UI components related to likes, comment submission, and profile rendering.


## Acknowledgements
This project was developed as the final project for **NETS 2120: Scalable and Cloud Computing** at the University of Pennsylvania.

