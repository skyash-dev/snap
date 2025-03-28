import { Button } from "@/components/ui/button";
import { Snap } from "../types";

interface SnapViewerProps {
  snap: Snap;
  onClose: () => void;
}

export function SnapViewer({ snap, onClose }: SnapViewerProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-[#1E1E1E] p-6 rounded-lg w-[90%] max-w-lg text-white shadow-lg relative max-h-[90vh] flex flex-col">
        <Button
          variant="ghost"
          className="absolute top-4 right-4 text-gray-400 hover:text-red-400"
          onClick={onClose}
        >
          ✖
        </Button>

        <h2 className="text-lg font-semibold mb-3">{snap.title}</h2>

        <div className="flex-1 overflow-y-auto max-h-[70vh] p-2 bg-[#282828] rounded-md">
          {renderContent(snap)}
        </div>

        <TagsList tags={snap.tags} />

        <div className="opacity-60 text-xs font-light mt-3">
          <span className="text-gray-400">Created At:</span>{" "}
          {new Date(snap.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function renderContent(snap: Snap) {
  switch (snap.content_type) {
    case "image":
      return (
        <img
          src={snap.content}
          alt="Snap Image"
          className="rounded-md max-w-full"
        />
      );
    case "url":
      return (
        <a
          href={snap.content}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline break-words"
        >
          {snap.content}
        </a>
      );
    default:
      return <p className="text-sm whitespace-pre-wrap">{snap.content}</p>;
  }
}

function TagsList({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {tags
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
  );
}
