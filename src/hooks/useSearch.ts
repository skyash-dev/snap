import { useState, useCallback } from "react";
import debounce from "lodash.debounce";
import { dbService } from "../services/dbService";

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      setIsSearching(true);
      try {
        const results = await dbService.searchSnaps(query);
        return results;
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    debouncedSearch,
  };
}
