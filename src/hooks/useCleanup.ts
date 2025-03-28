import { useEffect } from "react";

export function useCleanup(cleanup: () => void) {
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
}

// Usage in components
function Component() {
  useCleanup(() => {
    // Clean up resources, cancel subscriptions, etc.
  });
}
