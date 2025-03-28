import { useState, useEffect } from "react";
import { LLMType } from "../types";
import { initLLM } from "../services/llmService";

export function useSettings() {
  const storedApiKey = localStorage.getItem("apiKey") || "";
  const storedLLM = localStorage.getItem("llm") as LLMType | null;
  const storedIsFetchClipboard =
    localStorage.getItem("isFetchClipboard") === "true";

  const [apiKey, setApiKey] = useState(storedApiKey);
  const [llm, setLLM] = useState<LLMType>(storedLLM || "openai");
  const [isFetchClipboard, setIsFetchClipboard] = useState(
    storedIsFetchClipboard
  );

  useEffect(() => {
    initLLM(llm, apiKey);
  }, [llm, apiKey]);

  const updateApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem("apiKey", newKey);
  };

  const updateLLM = (newLLM: LLMType) => {
    setLLM(newLLM);
    localStorage.setItem("llm", newLLM);
  };

  const updateIsFetchClipboard = (value: boolean) => {
    setIsFetchClipboard(value);
    localStorage.setItem("isFetchClipboard", value.toString());
  };

  return {
    apiKey,
    llm,
    isFetchClipboard,
    updateApiKey,
    updateLLM,
    updateIsFetchClipboard,
  };
}
