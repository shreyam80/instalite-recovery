import * as dotenv from "dotenv";
dotenv.config();
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { retrieveRelevantDocs, createRetriever } from "./vector.js";

const template = `
Answer the question based on the following context:

Context:
{context}

Question:
{question}

Answer:
`;

const prompt = new PromptTemplate({
  template,
  inputVariables: ["context", "question"]
});

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.7
});

export async function callChatbot(query) {
  try {
    const docs = await retrieveRelevantDocs(query);
    const context = docs.map(d => d.pageContent).join("\n\n");

    const filledPrompt = await prompt.format({ context, question: query });
    const response = await model.call([{ role: "user", content: filledPrompt }]);

    return response.text;
  } catch (err) {
    console.error("Chatbot error:", err);
    return "Sorry, I had an issue answering your question.";
  }
}

const blurbs = [
  "Ryan Gosling is a Canadian actor known for The Notebook, Drive, La La Land, and Barbie.",
  "Margot Robbie starred in Barbie, The Wolf of Wall Street, and Suicide Squad.",
  "Christopher Nolan directed Inception and Interstellar."
];

await createRetriever(blurbs);
const answer = await callChatbot("Who was in Barbie?");
console.log("Answer:", answer);
