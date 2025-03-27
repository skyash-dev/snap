import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { Snap } from "@/App";
import { cosineSimilarity } from "@/lib/cosineSimilarity";

let selectedModel: any;
let embeddings: any;

export async function initLLM(
  model: "openai" | "claude" | "gemini",
  apiKey: string
) {
  try {
    if (model === "openai") {
      selectedModel = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: "gpt-4-turbo",
        temperature: 0.5,
      });
      embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        apiKey: apiKey,
      });
    } else if (model === "claude") {
      selectedModel = new ChatAnthropic({
        anthropicApiKey: apiKey,
        modelName: "claude-3-opus-2024-02-29",
        temperature: 0.5,
      });
    } else if (model === "gemini") {
      selectedModel = new ChatGoogleGenerativeAI({
        modelName: "gemini-1.5-pro",
        apiKey: apiKey,
        temperature: 0.5,
      });
      embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: apiKey,
      });
    } else {
      throw new Error("Invalid LLM model selected");
    }
  } catch (error) {
    console.error("LLM Processing Error:", error);
  }
}

export async function processContent(content: string) {
  try {
    const prompt = new PromptTemplate({
      template: `
          Analyze the following content and return structured JSON:
          - title: A short, meaningful title
          - contentType: "text", "link", "image", "code", etc.
          - tags: List of 3-5 relevant tags
          
          Content: "{content}"
        `,
      inputVariables: ["content"],
    });

    const formattedPrompt = await prompt.format({ content });
    const response = await selectedModel.invoke(formattedPrompt);
    const cleanResponse = response.text.replace(/```json|```/g, "").trim();

    const snap = JSON.parse(cleanResponse);

    const inputText = `${snap.title}\n${snap.content}\nTags: ${snap.tags.join(
      ", "
    )}`;
    const embedding = await createEmbedding(inputText);

    return { ...snap, embedding: JSON.stringify(embedding), llmError: false };
  } catch (error) {
    console.error("LLM Processing Error:", error);
    return {
      title: "Untitled Snap",
      contentType: "text",
      tags: [],
      llmError: true,
    };
  }
}

export async function createEmbedding(text: string) {
  return await embeddings.embedQuery(text); // Returns an array of floats
}

export async function retrieveRelevantSnaps(
  query: string,
  snaps: Snap[],
  topK = 1
): Promise<Snap[]> {
  const queryEmbedding = await createEmbedding(query);

  return snaps
    .map((snap: Snap) => ({
      ...snap,
      similarity: cosineSimilarity(queryEmbedding, JSON.parse(snap.embedding)),
    }))
    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity
    .slice(0, topK);
}
