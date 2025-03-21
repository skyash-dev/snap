import "./App.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Database from "@tauri-apps/plugin-sql";
import { useEffect, useState } from "react";

type Snap = {
  id: number;
  title: string;
  content: string;
  content_type: string;
  tags: string;
  created_at: string;
};

function App() {
  return (
    <main className="dark">
      <Main />
    </main>
  );
}

function Main() {
  const [error, setError] = useState<string | null>(null);
  const [snaps, setSnaps] = useState<Snap[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function getSnaps() {
    try {
      const db = await Database.load("sqlite:snap.db");
      const dbSnaps = await db.select<Snap[]>("SELECT * FROM snaps");

      setError(null);
      setSnaps(dbSnaps);
      setIsLoading(false);
      console.log(dbSnaps);
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
        "INSERT INTO snaps (title,content, content_type, tags,created_at) VALUES ($1, $2,$3,$4,$5)",
        [
          snap.title,
          snap.content,
          snap.content_type,
          snap.tags,
          snap.created_at,
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
    } catch (error) {
      console.log(error);
      setError("Failed to delete snap - check console");
    }
  }

  return (
    <div className="m-6">
      <Tabs defaultValue="snap" className="w-full" defaultChecked={true}>
        <TabsList className=" self-center">
          <TabsTrigger value="snap">Snap</TabsTrigger>
          <TabsTrigger value="browse">Browse</TabsTrigger>
        </TabsList>
        <TabsContent value="snap" className="flex justify-center">
          <SnapMode addSnap={addSnap} error={error} isLoading={isLoading} />
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
      </Tabs>
    </div>
  );
}

interface snapProps {
  addSnap: Function;
  error: string | null;
  isLoading: boolean;
}
function SnapMode({ addSnap, error, isLoading }: snapProps) {
  const [content, setContent] = useState<string>("");

  if (error) return error;

  return (
    <div className="flex flex-col items-center space-y-2 w-3/4">
      <Input
        type="text"
        placeholder="snap a link, text, or idea"
        className="text-sm"
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
        }}
      />
      <Button
        type="submit"
        className="cursor-pointer w-full"
        onClick={() => {
          addSnap({
            title: "auto generated",
            content: content,
            content_type: "auto generated",
            tags: "auto generated",
            created_at: "auto generated",
          });
        }}
      >
        Snap
      </Button>
    </div>
  );
}

interface browseProps {
  snaps: Snap[] | null;
  getSnaps: Function;
  removeSnap: Function;
  error: string | null;
  isLoading: boolean;
}
function BrowseMode({
  snaps,
  getSnaps,
  removeSnap,
  error,
  isLoading,
}: browseProps) {
  useEffect(() => {
    getSnaps();
  });

  if (error) return error;

  return (
    <>
      <Input
        type="text"
        placeholder="search a link, text, or idea"
        className="text-sm w-3/4"
      />
      <div className="space-y-2 w-3/4">
        {snaps
          ? snaps.map((snap: Snap) => {
              return (
                <div className="flex w-full gap-2">
                  <div className="bg-muted p-6 rounded-md w-[100px] h-[100px]"></div>
                  <div className="m-1 w-3/4 justify-between text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span>{snap.title}</span>
                        <div className="flex flex-col opacity-60 text-xs font-light">
                          <span>Type:{snap.content_type}</span>
                          <div className="flex space-x-2">
                            <span>Tags:{snap.tags}</span>
                            <div className="space-x-1">
                              {/* <span className="bg-muted py-[2px] px-1 rounded-md text-xs">
                      Hello
                    </span>
                    <span className="bg-muted py-[2px] px-1 rounded-md text-xs">
                      Hello
                    </span> */}
                            </div>
                          </div>
                          <span>Created At:{snap.created_at}</span>
                        </div>
                      </div>
                      <Button
                        variant={"ghost"}
                        className="cursor-pointer"
                        onClick={() => {
                          removeSnap(snap.id);
                        }}
                      >
                        X
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </>
  );
}
export default App;
