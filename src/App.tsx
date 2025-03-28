import "./App.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Database from "@tauri-apps/plugin-sql";
import { useEffect, useMemo, useState } from "react";
import {
  initLLM,
  processContent,
  retrieveRelevantSnaps,
} from "./services/llmService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import debounce from "lodash.debounce";

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
  return (
    <main className="dark">
      <Main />
      <Toaster />
    </main>
  );
}

function Main() {
  const [error, setError] = useState<string | null>(null);
  const [snaps, setSnaps] = useState<Snap[] | []>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const storedIsFetchClipboard = localStorage.getItem("isFetchClipboard");
  const isFetchClipboardDefault = storedIsFetchClipboard === "true";
  const [isFetchClipboard, setIsFetchClipboard] = useState<boolean>(
    isFetchClipboardDefault
  );

  const storedApiKey = localStorage.getItem("apiKey") || "";
  const [apiKey, setApiKey] = useState<string>(storedApiKey);

  let localLLM: "claude" | "gemini" | "openai" = "claude";
  const storedLLM = localStorage.getItem("llm") as
    | "claude"
    | "gemini"
    | "openai"
    | null;

  if (
    storedLLM === "claude" ||
    storedLLM === "gemini" ||
    storedLLM === "openai"
  ) {
    localLLM = storedLLM;
  }

  const [llm, setLLM] = useState<"claude" | "gemini" | "openai">(localLLM);

  useEffect(() => {
    initLLM(llm, apiKey);
  }, []);

  useEffect(() => {
    getSnaps();
    toast(error);
  }, [error]);

  async function getSnaps() {
    try {
      const db = await Database.load("sqlite:snap.db");
      const dbSnaps = await db.select<Snap[]>("SELECT * FROM snaps");

      setSnaps(dbSnaps);
      setIsLoading(false);
      // console.log(dbSnaps);
    } catch (error) {
      console.log(error);
      setError("Failed to get snaps - check console");
    }
  }

  async function addSnap(snap: Omit<Snap, "id">) {
    try {
      setIsLoading(true);
      const db = await Database.load("sqlite:snap.db");

      await db.execute(
        "INSERT INTO snaps (title, content, content_type, tags, created_at, embedding) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          snap.title,
          snap.content,
          snap.content_type,
          snap.tags.toString(),
          snap.created_at,
          snap.embedding,
        ]
      );

      getSnaps().then(() => setIsLoading(false));
    } catch (error) {
      console.log(error);
      setError("Failed to insert snap - check console");
    }
  }
  async function removeSnap(snapId: number) {
    try {
      setIsLoading(true);
      const db = await Database.load("sqlite:snap.db");

      // 🗑️ DELETE snap where id matches
      await db.execute("DELETE FROM snaps WHERE id = $1", [snapId]);

      // Refresh the snaps list after deletion
      await getSnaps();
      setIsLoading(false);
      toast(
        `🗑️ Snap "${
          snaps?.filter((snap: Snap) => snap.id == snapId)[0].title
        }" deleted!`
      );
    } catch (error) {
      console.log(error);
      setError("Failed to delete snap - check console");
    }
  }

  const handleSnapContent = async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);
    toast("Adding Snap!");
    try {
      await initLLM(llm, apiKey);
      const processed = await processContent(content);
      // console.log(processed);

      addSnap({
        title: processed.title,
        content: processed.content,
        content_type: processed.contentType,
        tags: processed.tags,
        created_at: new Date().toISOString(),
        embedding: processed.embedding,
      });

      getSnaps();

      if (processed.llmError) {
        setError(
          "LLM ERROR: AI processing failed. Ensure your API key and LLM configuration are correctly set up."
        );
      }
    } catch (error) {
      console.error("Error processing content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="m-6">
      <Tabs defaultValue="snap" className="w-full" defaultChecked={true}>
        <TabsList className=" self-center">
          <TabsTrigger value="snap">Snap</TabsTrigger>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="snap" className="flex justify-center">
          <SnapMode
            handleSnapContent={handleSnapContent}
            error={error}
            apiKey={apiKey}
            setApiKey={setApiKey}
            setLLM={setLLM}
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
            getSnaps={getSnaps}
            removeSnap={removeSnap}
            error={error}
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="settings">
          <Settings
            apiKey={apiKey}
            setApiKey={setApiKey}
            setLLM={setLLM}
            isFetchClipboard={isFetchClipboard}
            setIsFetchClipboard={setIsFetchClipboard}
            llm={llm}
            snaps={snaps}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface SnapProps {
  handleSnapContent: Function;
  error: string | null;
  apiKey: string;
  setApiKey: Function;
  setLLM: Function;
  setError: Function;
  isFetchClipboard: boolean;
}
function SnapMode({
  handleSnapContent,
  setError,
  isFetchClipboard,
}: SnapProps) {
  const [content, setContent] = useState<string>("");

  const fetchClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContent(text);
      }
    } catch (err) {
      setError("Clipboard read failed", err);
    }
  };

  useEffect(() => {
    if (isFetchClipboard) {
      fetchClipboard();
    }
  }, []);

  return (
    <div className="flex flex-col items-center space-y-2 w-full">
      <Input
        type="text"
        placeholder="snap a thought, link, or idea! ⚡"
        className="text-sm"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
        }}
        onClick={() => {
          isFetchClipboard ? fetchClipboard() : null;
        }}
      />
      <Button
        type="submit"
        className="cursor-pointer w-full"
        onClick={() => {
          handleSnapContent(content);
          setContent("");
        }}
      >
        Snap
      </Button>
    </div>
  );
}

interface BrowseProps {
  snaps: Snap[];
  getSnaps: Function;
  removeSnap: Function;
  error: string | null;
  isLoading: boolean;
}
function BrowseMode({ snaps, removeSnap }: BrowseProps) {
  const [selectedSnap, setSelectedSnap] = useState<Snap | null>(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [relevantSnaps, setRelevantSnaps] = useState<Snap[]>(snaps);
  const [searchQuery, setSearchQuery] = useState("");

  async function searchSnaps() {
    if (!snaps) return;

    const searchLower = searchQuery.toLowerCase();

    // 📝 Filter Snaps Based on Search Query
    let filteredSnaps = snaps.filter((snap) =>
      [snap.title, snap.content, snap.tags.toString().split(",").join(",")]
        .map((text) => text.toLowerCase())
        .some((text) => text.includes(searchLower))
    );

    // If searchQuery is empty, reset to all snaps
    if (searchQuery.trim() === "") {
      setRelevantSnaps(snaps);
    }

    // Use AI search only if no exact matches
    if (
      searchQuery.length > 1 &&
      (filteredSnaps.length == 0 || filteredSnaps.length == snaps.length)
    ) {
      const searchedSnaps = await retrieveRelevantSnaps(searchQuery, snaps);
      filteredSnaps = searchedSnaps;
    }

    // 🔄 Sort Snaps Based on Selection
    const sortedSnaps = filteredSnaps.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();

      return sortOrder === "newest"
        ? dateB - dateA
        : sortOrder === "oldest"
        ? dateA - dateB
        : sortOrder === "title-asc"
        ? a.title.localeCompare(b.title)
        : sortOrder === "title-desc"
        ? b.title.localeCompare(a.title)
        : 0;
    });

    setRelevantSnaps(sortedSnaps);
  }

  // 🎯 Use Memoized & Debounced Search
  const debouncedSearch = useMemo(
    () => debounce(searchSnaps, 300),
    [searchQuery, snaps, sortOrder]
  );

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel(); // Cleanup function
  }, [searchQuery, snaps, sortOrder]);

  return selectedSnap ? (
    <SnapViewer
      snap={selectedSnap}
      onClose={() => {
        setSelectedSnap(null);
      }}
    />
  ) : (
    <div className="w-full flex flex-col gap-4 justify-center">
      {/* 🔍 Search Bar & Sort Dropdown */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="find your snaps in a snap!"
          className="text-sm w-full"
          onEmptied={() => {
            setRelevantSnaps(snaps);
          }}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
        />
        {/* <Button
          className="cursor-pointer w-[40px] "
          variant={"outline"}
        >
          🔍
        </Button> */}
        <div>
          <Select
            onValueChange={(value: any) => setSortOrder(value)}
            defaultValue="newest"
          >
            <SelectTrigger className="w-[140px] text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="dark">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 📜 Snaps List */}
      {relevantSnaps.map((snap) => (
        <div
          key={snap.id}
          className="flex w-full gap-3 p-3 bg-[#1E1E1E] rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition max-h-[70px]"
          onClick={() => setSelectedSnap(snap)}
        >
          <span className="text-md rotate-[-10deg] rounded-md bg-[#282828] p-2">
            {snap.content_type === "image"
              ? "🖼️"
              : snap.content_type === "url"
              ? "🔗"
              : snap.content_type === "text"
              ? "📝"
              : "📄"}
          </span>
          <div className="flex flex-col justify-between w-full text-sm">
            <span className="font-medium text-white truncate w-[300px]">
              {snap.title}
            </span>
            <div className="opacity-60 text-xs font-light mt-1">
              <span className="text-gray-400">Created At:</span>{" "}
              <span className="text-white">
                {new Date(snap.created_at).toLocaleString()}
              </span>
            </div>
          </div>
          <Button
            className="cursor-pointer text-gray-400 hover:text-red-400"
            variant={"ghost"}
            onClick={(e) => {
              e.stopPropagation();
              removeSnap(snap.id);
            }}
          >
            ✖
          </Button>
        </div>
      ))}
    </div>
  );
}

interface SnapViewerProps {
  snap: Snap;
  onClose: () => void;
}

function SnapViewer({ snap, onClose }: SnapViewerProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-[#1E1E1E] p-6 rounded-lg w-[90%] max-w-lg text-white shadow-lg relative max-h-[90vh] flex flex-col">
        {/* ❌ Close Button (Properly Positioned) */}
        <Button
          variant={"ghost"}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-400"
          onClick={onClose}
        >
          ✖
        </Button>

        {/* 🖼️ Content Display */}
        <h2 className="text-lg font-semibold mb-3">{snap.title}</h2>

        <div className="flex-1 overflow-y-auto max-h-[70vh] p-2 bg-[#282828] rounded-md">
          {snap.content_type === "image" ? (
            <img
              src={snap.content}
              alt="Snap Image"
              className="rounded-md max-w-full"
            />
          ) : snap.content_type === "url" ? (
            <a
              href={snap.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline break-words"
            >
              {snap.content}
            </a>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{snap.content}</p>
          )}
        </div>

        {/* 📌 Tags */}
        {snap?.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {snap.tags
              .toString()
              .replace(/(\r\n|\n|\r)/gm, "")
              .split(",")
              .map((tag, index) => (
                <span
                  key={index}
                  className="bg-[#333333] text-white py-[2px] px-2 rounded-md text-xs"
                >
                  {tag}
                </span>
              ))}
          </div>
        )}

        {/* 🕒 Timestamp */}
        <div className="opacity-60 text-xs font-light mt-3">
          <span className="text-gray-400">Created At:</span>{" "}
          {new Date(snap.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

interface SettingsProps {
  apiKey: string;
  setApiKey: Function;
  setLLM: Function;
  isFetchClipboard: boolean;
  setIsFetchClipboard: Function;
  llm: "openai" | "claude" | "gemini";
  snaps: Snap[];
}
function Settings({
  apiKey,
  setApiKey,
  setLLM,
  isFetchClipboard,
  setIsFetchClipboard,
  llm,
}: SettingsProps) {
  useEffect(() => {
    initLLM(llm, apiKey);
  }, [apiKey, llm]);

  return (
    <div className="flex flex-col items justify-between h-[60vh]">
      <div className="flex items-center flex-col gap-4">
        <div className="flex justify-center space-x-2 w-3/4">
          <Select
            onValueChange={(value: any) => {
              setLLM(value);
              localStorage.setItem("llm", value);
            }}
            value={llm}
          >
            <SelectTrigger className="w-[140px] text-sm">
              <SelectValue placeholder="LLM" />
            </SelectTrigger>
            <SelectContent className="dark">
              <SelectItem value="claude">Claude</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="gemini">Gemini</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="password"
            placeholder="API-KEY"
            className="text-sm"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              localStorage.setItem("apiKey", e.target.value);
            }}
          />
        </div>
        <div className="items-top flex w-3/4 space-x-2">
          <Checkbox
            checked={isFetchClipboard}
            id="isFetchClipboard"
            onCheckedChange={(value) => {
              setIsFetchClipboard(value);
              localStorage.setItem("isFetchClipboard", value ? "1" : "0");
            }}
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
    </div>
  );
}

export default App;
