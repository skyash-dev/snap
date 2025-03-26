import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { Snap } from "@/App";

let selectedModel: any;
let embeddings: any;
let vectorStore: any;

export async function initLLM(
  model: "openai" | "claude" | "gemini",
  apiKey: string,
  snaps: Snap[]
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

      vectorStore = new MemoryVectorStore(embeddings);

      storeVectors(snaps);
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

    return { ...snap, llmError: false };
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

async function storeVectors(snaps: Snap[]) {
  const snapDocs = snaps.map((snap) => {
    return new Document({
      pageContent: `${snap.title}\n${snap.content}\nTags: ${snap.tags}`,
      metadata: {
        content_type: snap.content_type,
        created_at: snap.created_at,
        title: snap.title,
        tags: snap.tags,
      },
    });
  });
  await vectorStore.addDocuments(snapDocs);
}

export async function retrieveRelevantSnaps(
  query: string,
  topK = 1
): Promise<Snap[]> {
  const results = await vectorStore.similaritySearch(query, topK);

  // Convert Documents to Snaps
  const snaps: Snap[] = results.map((doc: Document) => ({
    id: doc.metadata.snapId,
    title: doc.metadata.title,
    content: doc.pageContent, // Extract content from Document
    content_type: doc.metadata.content_type,
    created_at: doc.metadata.created_at,
    tags: doc.metadata.tags || [],
  }));

  return snaps;
}
