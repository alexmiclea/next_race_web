"use client";

import { useEffect } from "react";
import { readFavoritesFromDocument, saveFavorites } from "@/lib/favorites";

/**
 * On the favourites page: drops ids of races that have passed or were removed, so
 * the count in the header matches the list. Runs once, after the page has loaded.
 */
export function FavoritesPrune({ keep }: { keep: string[] }) {
  useEffect(() => {
    const current = readFavoritesFromDocument();
    const pruned = current.filter((id) => keep.includes(id));
    if (pruned.length !== current.length) saveFavorites(pruned);
  }, [keep]);
  return null;
}
