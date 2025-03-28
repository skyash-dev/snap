import { useEffect } from "react";

export function useCleanup(cleanup: () => void) {
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
}

