import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Snap } from "../types";
import { retrieveRelevantSnaps } from "../services/llmService";
import debounce from "lodash.debounce";
import { SnapViewer } from "./SnapViewer";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAptabase } from "@aptabase/react";
import { AnalyticsEvents } from "../services/analyticsService";

type SortOrder = "newest" | "oldest" | "title-asc" | "title-desc";

interface BrowseModeProps {
  snaps: Snap[];
  removeSnap: (id: number) => Promise<void>;
  isLoading: boolean;
}

export function BrowseMode({ snaps, removeSnap, isLoading }: BrowseModeProps) {
  const { trackEvent } = useAptabase();
  const [selectedSnap, setSelectedSnap] = useState<Snap | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [relevantSnaps, setRelevantSnaps] = useState<Snap[]>(snaps);
  const [searchQuery, setSearchQuery] = useState("");

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: relevantSnaps.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70, // height of each snap item
    overscan: 5,
  });

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.length > 0) {
        trackEvent(AnalyticsEvents.SEARCH_PERFORMED, {
          query_length: query.length,
        });
      }
    },
    [trackEvent]
  );

  const handleSnapSelect = (snap: Snap) => {
    setSelectedSnap(snap);
    trackEvent(AnalyticsEvents.SNAP_VIEWED);
  };

  async function searchSnaps() {
    if (!snaps.length) return;

    const searchLower = searchQuery.toLowerCase();

    let filteredSnaps = snaps.filter((snap) =>
      [snap.title, snap.content, snap.tags.toString()]
        .map((text) => text.toLowerCase())
        .some((text) => text.includes(searchLower))
    );

    if (searchQuery.trim() === "") {
      setRelevantSnaps(snaps);
      return;
    }

    if (
      searchQuery.length > 1 &&
      (filteredSnaps.length === 0 || filteredSnaps.length === snaps.length)
    ) {
      filteredSnaps = await retrieveRelevantSnaps(searchQuery, snaps);
    }

    const sortedSnaps = sortSnaps(filteredSnaps, sortOrder);
    setRelevantSnaps(sortedSnaps);
  }

  const sortSnaps = useCallback(
    (snapsToSort: Snap[], order: SortOrder): Snap[] => {
      return [...snapsToSort].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();

        switch (order) {
          case "newest":
            return dateB - dateA;
          case "oldest":
            return dateA - dateB;
          case "title-asc":
            return a.title.localeCompare(b.title);
          case "title-desc":
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
    },
    []
  );

  const sortedSnaps = useMemo(
    () => sortSnaps(relevantSnaps, sortOrder),
    [relevantSnaps, sortOrder, sortSnaps]
  );

  const debouncedSearch = useMemo(
    () => debounce(searchSnaps, 300),
    [searchQuery, snaps, sortOrder]
  );

  useEffect(() => {
    debouncedSearch();
    return () => debouncedSearch.cancel();
  }, [searchQuery, snaps, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!snaps.length) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-400">
        No snaps yet! Create your first one.
      </div>
    );
  }

  return (
    <>
      {selectedSnap ? (
        <SnapViewer snap={selectedSnap} onClose={() => setSelectedSnap(null)} />
      ) : (
        <div className="w-full flex flex-col gap-4 justify-center">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="find your snaps in a snap!"
              className="text-sm w-full"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Select
              onValueChange={(value: SortOrder) => setSortOrder(value)}
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

          <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow: VirtualItem) => (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                    width: "100%",
                  }}
                >
                  <SnapListItem
                    snap={sortedSnaps[virtualRow.index]}
                    onSelect={() =>
                      handleSnapSelect(sortedSnaps[virtualRow.index])
                    }
                    onRemove={() =>
                      removeSnap(sortedSnaps[virtualRow.index].id)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface SnapListItemProps {
  snap: Snap;
  onSelect: () => void;
  onRemove: () => void;
}

function SnapListItem({ snap, onSelect, onRemove }: SnapListItemProps) {
  const contentTypeIcons = {
    image: "🖼️",
    url: "🔗",
    text: "📝",
    default: "📄",
  };

  return (
    <div
      className="flex w-full gap-3 p-3 bg-[#1E1E1E] rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition max-h-[70px]"
      onClick={onSelect}
    >
      <span className="text-md rotate-[-10deg] rounded-md bg-[#282828] p-2">
        {contentTypeIcons[snap.content_type as keyof typeof contentTypeIcons] ||
          contentTypeIcons.default}
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
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        ✖
      </Button>
    </div>
  );
}

export default BrowseMode;
