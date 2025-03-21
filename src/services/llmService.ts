import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

export async function processContent(
  content: string,
  model: "openai" | "claude" | "gemini",
  apiKey: string // Pass user-input API key
) {
  try {
    let selectedModel;

    if (model === "openai") {
      selectedModel = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: "gpt-4-turbo",
        temperature: 0.5,
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
    } else {
      throw new Error("Invalid LLM model selected");
    }

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

    return { ...JSON.parse(cleanResponse), llmError: false };
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
