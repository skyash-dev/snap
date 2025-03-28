import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LLMType } from "../types";
import { useAptabase } from "@aptabase/react";
import { AnalyticsEvents } from "../services/analyticsService";

interface SettingsProps {
  apiKey: string;
  llm: LLMType;
  isFetchClipboard: boolean;
  updateApiKey: (key: string) => void;
  updateLLM: (llm: LLMType) => void;
  updateIsFetchClipboard: (value: boolean) => void;
}

export function Settings({
  apiKey,
  llm,
  isFetchClipboard,
  updateApiKey,
  updateLLM,
  updateIsFetchClipboard,
}: SettingsProps) {
  const { trackEvent } = useAptabase();

  const handleApiKeyChange = (newKey: string) => {
    updateApiKey(newKey);
    trackEvent(AnalyticsEvents.SETTINGS_CHANGED, {
      setting: "api_key",
      value: "updated",
    });
  };

  const handleLLMChange = (newLLM: LLMType) => {
    updateLLM(newLLM);
    trackEvent(AnalyticsEvents.SETTINGS_CHANGED, {
      setting: "llm",
      value: newLLM,
    });
  };

  const handleFetchClipboardChange = (value: boolean) => {
    updateIsFetchClipboard(value);
    trackEvent(AnalyticsEvents.SETTINGS_CHANGED, {
      setting: "fetch_clipboard",
      value: value.toString(),
    });
  };

  return (
    <div className="flex flex-col items justify-between h-[60vh]">
      <div className="flex items-center flex-col gap-4">
        <div className="flex justify-center space-x-2 w-3/4">
          <Select onValueChange={handleLLMChange} value={llm}>
            <SelectTrigger className="w-[140px] text-sm">
              <SelectValue placeholder="LLM" />
            </SelectTrigger>
            <SelectContent className="dark">
              {/* <SelectItem value="claude">Claude</SelectItem> */}
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="password"
            placeholder="API-KEY"
            className="text-sm"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
          />
        </div>
        <div className="items-top flex w-3/4 space-x-2">
          <Checkbox
            checked={isFetchClipboard}
            id="isFetchClipboard"
            onCheckedChange={handleFetchClipboardChange}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="isFetchClipboard"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Auto Fetch Clipboard
            </label>
          </div>
        </div>
      </div>
      <AuthorFooter />
    </div>
  );
}

function AuthorFooter() {
  return (
    <a
      className="flex flex-col items-center text-xs opacity-50 hover:opacity-90 transition-opacity font-extralight"
      href="https://x.com/_skyash/"
      target="_blank"
    >
      <img
        src="./src/assets/skyash.jpeg"
        alt="skyash"
        className="rounded-full size-10"
      />
      crafted by skyash!
    </a>
  );
}

export default Settings;
