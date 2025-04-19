import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

// using a retriever as was done in Lecture 17
let retriever = null;

/*initializing the retriever, where textChunks is an array of movie and actor blurbs
(hardcoded from chatbot.js as of right now)*/
/*the point of this function is to convert the string to langchain, then use a splitter as in lecture 17,
then generate the embeddings, then store this in a memory vector store*/
export async function createRetriever(textChunks) {
  const docs = textChunks.map(text => new Document({ pageContent: text }));
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 300,
    chunkOverlap: 30
  });
  const splitDocs = await splitter.splitDocuments(docs);
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
  retriever = vectorStore.asRetriever();
}


export async function retrieveRelevantDocs(query) {
  if (!retriever) {
    throw new Error("Retriever not initialized. Call createRetriever() first.");
  }
  return await retriever.getRelevantDocuments(query); 
  /*using k=5 as the image topK algorithm in the app gives out the top 5 actor matches*/
}
