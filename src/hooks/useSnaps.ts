import { useState, useEffect } from "react";
import { Snap } from "../types";
import { toast } from "sonner";
import { dbService } from "../services/dbService";
import { Analytics } from "../services/analyticsService";

export function useSnaps() {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSnaps();
  }, []);

  async function getSnaps() {
    try {
      setIsLoading(true);
      const dbSnaps = await dbService.getAllSnaps();
      setSnaps(dbSnaps);
    } catch (error) {
      console.log(error);
      setError("Failed to get snaps - check console");
    } finally {
      setIsLoading(false);
    }
  }

  async function addSnap(snap: Omit<Snap, "id">) {
    try {
      setIsLoading(true);
      await dbService.insertSnap(snap);
      await getSnaps();
      Analytics.trackSnapCreated(snap.content_type);
    } catch (error) {
      console.log(error);
      setError("Failed to insert snap - check console");
      toast.error("Failed to add snap");
      Analytics.trackError(
        "snap_creation",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function removeSnap(snapId: number) {
    try {
      setIsLoading(true);
      const snapToDelete = snaps.find((snap) => snap.id === snapId);
      await dbService.deleteSnap(snapId);
      await getSnaps();
      toast.success(`🗑️ Snap "${snapToDelete?.title}" deleted!`);
      Analytics.trackSnapDeleted();
    } catch (error) {
      console.log(error);
      setError("Failed to delete snap - check console");
      toast.error("Failed to delete snap");
      Analytics.trackError(
        "snap_deletion",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return { snaps, isLoading, error, getSnaps, addSnap, removeSnap, setError };
}
