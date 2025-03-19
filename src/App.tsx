import "./App.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";

function App() {
  return (
    <main className="dark">
      <Main />
    </main>
  );
}

function Main() {
  return (
    <div className="m-6">
      <Tabs defaultValue="snap" className="w-full" defaultChecked={true}>
        <TabsList className=" self-center">
          <TabsTrigger value="snap">Snap</TabsTrigger>
          <TabsTrigger value="browse">Browse</TabsTrigger>
        </TabsList>
        <TabsContent value="snap" className="flex justify-center">
          <SnapMode />
        </TabsContent>
        <TabsContent
          value="browse"
          className="flex flex-col gap-4 items-center"
        >
          <BrowseMode />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SnapMode() {
  return (
    <div className="flex flex-col items-center space-y-2 w-3/4">
      <Input
        type="text"
        placeholder="snap a link, text, or idea"
        className="text-sm"
      />
      <Button type="submit" className="cursor-pointer w-full">
        Snap
      </Button>
    </div>
  );
}

function BrowseMode() {
  return (
    <>
      <Input
        type="text"
        placeholder="search a link, text, or idea"
        className="text-sm w-3/4"
      />
      <div className="flex gap-2">
        <div className="bg-muted p-6 rounded-md w-[100px] h-[100px]"></div>
        <div className="m-1 w-3/4 flex flex-col justify-between text-sm">
          <div>Lorem ipsum dolor sit amet consectetur.</div>
          <div className="flex flex-col opacity-60 text-xs font-light">
            <span>Type:</span>
            <div className="flex space-x-2">
              <span>Tags:</span>
              <div className="space-x-1">
                <span className="bg-muted py-[2px] px-1 rounded-md text-xs">
                  Hello
                </span>
                <span className="bg-muted py-[2px] px-1 rounded-md text-xs">
                  Hello
                </span>
              </div>
            </div>
            <span>Created At:</span>
          </div>
        </div>
      </div>
    </>
  );
}
export default App;
