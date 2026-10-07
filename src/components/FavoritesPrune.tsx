"use client";

import { useEffect } from "react";
import { readFavoritesFromDocument, saveFavorites } from "@/lib/favorites";

/**
 * On the favourites page: drops ids of races that no longer exist or aren't public
 * (past races are kept). Runs after the page has loaded.
 */
export function FavoritesPrune({ keep }: { keep: string[] }) {
  useEffect(() => {
    const current = readFavoritesFromDocument();
    const pruned = current.filter((id) => keep.includes(id));
    // Removed races were never in the header count, so the count doesn't change.
    if (pruned.length !== current.length) saveFavorites(pruned, 0);
  }, [keep]);
  return null;
}
