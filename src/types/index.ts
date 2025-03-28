export type Snap = {
  id: number;
  title: string;
  content: string;
  content_type: string;
  tags: string[];
  created_at: string;
  embedding: string;
};

export type LLMType = "claude" | "gemini" | "openai"; 