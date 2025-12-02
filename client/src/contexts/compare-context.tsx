import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Listing } from "@shared/schema";

interface CompareContextType {
  compareItems: string[];
  addToCompare: (listingId: string) => void;
  removeFromCompare: (listingId: string) => void;
  clearCompare: () => void;
  isInCompare: (listingId: string) => boolean;
  canAddMore: boolean;
}

const CompareContext = createContext<CompareContextType | null>(null);

const MAX_COMPARE_ITEMS = 4;
const STORAGE_KEY = 'compareListings';

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareItems, setCompareItems] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareItems));
    } catch {
      // Ignore localStorage errors
    }
  }, [compareItems]);

  const addToCompare = (listingId: string) => {
    setCompareItems((prev) => {
      if (prev.includes(listingId)) return prev;
      if (prev.length >= MAX_COMPARE_ITEMS) return prev;
      return [...prev, listingId];
    });
  };

  const removeFromCompare = (listingId: string) => {
    setCompareItems((prev) => prev.filter((id) => id !== listingId));
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  const isInCompare = (listingId: string) => {
    return compareItems.includes(listingId);
  };

  const canAddMore = compareItems.length < MAX_COMPARE_ITEMS;

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canAddMore,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return context;
}
