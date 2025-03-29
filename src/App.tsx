import "./App.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy, Suspense, useEffect } from "react";
import { useSnaps } from "./hooks/useSnaps";
import { useSettings } from "./hooks/useSettings";
import { processContent } from "./services/llmService";
import { Toaster } from "sonner";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { AnalyticsEvents } from "./services/analyticsService";
import { useAptabase } from "@aptabase/react";
const SnapMode = lazy(() => import("./components/SnapMode"));
const BrowseMode = lazy(() => import("./components/BrowseMode"));
const Settings = lazy(() => import("./components/Settings"));

export type Snap = {
  id: number;
  title: string;
  content: string;
  content_type: string;
  tags: string[];
  created_at: string;
  embedding: string;
};

function App() {
  const { trackEvent } = useAptabase();

  useEffect(() => {
    trackEvent(AnalyticsEvents.APP_STARTED);
    return () => {
      trackEvent(AnalyticsEvents.APP_EXITED);
    };
  }, [trackEvent]);

  return (
    <main className="dark">
      <Suspense fallback={<LoadingSpinner />}>
        <Main />
      </Suspense>
      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#1e1e1e",
            color: "#ffffff",
            border: "1px solid #333333",
          },
        }}
      />
    </main>
  );
}

function Main() {
  const { snaps, isLoading, addSnap, removeSnap, setError } = useSnaps();
  const {
    apiKey,
    llm,
    isFetchClipboard,
    updateApiKey,
    updateLLM,
    updateIsFetchClipboard,
  } = useSettings();
  const { trackEvent } = useAptabase();
  const handleSnapContent = async (content: string) => {
    if (!content.trim()) return;

    try {
      const processed = await processContent(content);
      await addSnap({
        title: processed.title,
        content: processed.content,
        content_type: processed.contentType,
        tags: processed.tags,
        created_at: new Date().toISOString(),
        embedding: processed.embedding,
      });

      if (processed.llmError) {
        setError(
          "LLM ERROR: AI processing failed. Check API key and LLM configuration."
        );
      }
    } catch (error) {
      console.error("Error processing content:", error);
    }
  };

  const handleTabChange = (tab: string) => {
    trackEvent(AnalyticsEvents.TAB_CHANGED, { tab });
  };

  return (
    <div className="m-6">
      <Tabs
        defaultValue="snap"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="self-center">
          <TabsTrigger value="snap">Snap</TabsTrigger>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="snap" className="flex justify-center">
          <SnapMode
            handleSnapContent={handleSnapContent}
            setError={setError}
            isFetchClipboard={isFetchClipboard}
          />
        </TabsContent>

        <TabsContent
          value="browse"
          className="flex flex-col gap-4 items-center"
        >
          <BrowseMode
            snaps={snaps}
            removeSnap={removeSnap}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="settings">
          <Settings
            apiKey={apiKey}
            llm={llm}
            isFetchClipboard={isFetchClipboard}
            updateApiKey={updateApiKey}
            updateLLM={updateLLM}
            updateIsFetchClipboard={updateIsFetchClipboard}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
