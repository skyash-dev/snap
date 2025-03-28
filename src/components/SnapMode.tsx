import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAptabase } from "@aptabase/react";
import { AnalyticsEvents } from "../services/analyticsService";

interface SnapModeProps {
  handleSnapContent: (content: string) => Promise<void>;
  setError: (error: string) => void;
  isFetchClipboard: boolean;
}

export function SnapMode({
  handleSnapContent,
  setError,
  isFetchClipboard,
}: SnapModeProps) {
  const { trackEvent } = useAptabase();
  const [content, setContent] = useState("");

  const fetchClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setContent(text);
    } catch (err) {
      setError("Clipboard read failed");
    }
  };

  useEffect(() => {
    if (isFetchClipboard) fetchClipboard();
  }, []);

  const handleSnap = async () => {
    if (!content.trim()) return;

    toast("Adding snap...");
    await handleSnapContent(content);
    trackEvent(AnalyticsEvents.SNAP_CREATED, { content_type: "text" });
    setContent("");
  };

  return (
    <div className="flex flex-col items-center space-y-2 w-full">
      <Input
        type="text"
        placeholder="snap a thought, link, or idea! ⚡"
        className="text-sm"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onClick={() => isFetchClipboard && fetchClipboard()}
      />
      <Button
        type="submit"
        className="cursor-pointer w-full"
        onClick={handleSnap}
      >
        Snap
      </Button>
    </div>
  );
}

export default SnapMode;
