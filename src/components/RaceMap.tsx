"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

export type MapEvent = {
  id: string;
  name: string;
  /** Preformatted, e.g. "24 – 25 aprilie 2027". */
  dates: string;
  latitude: number;
  longitude: number;
};

/** Center of Romania, used when there is nothing to fit the view to. */
const ROMANIA: [number, number] = [45.94, 24.97];

export function RaceMap({ events, focusId }: { events: MapEvent[]; focusId?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const t = useTranslations("Map");
  const detailsLabel = useTranslations("Event")("details");
  const attribution = t("attribution");

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    // Leaflet touches `window` on import, so load it only in the browser.
    import("leaflet").then((L) => {
      if (cancelled || !container.current) return;

      const map = L.map(container.current, { scrollWheelZoom: false }).setView(ROMANIA, 7);
      cleanup = () => map.remove();
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: `<a href="https://www.openstreetmap.org/copyright">${attribution}</a>`,
      }).addTo(map);

      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      const markers: L.CircleMarker[] = [];
      let focused: L.CircleMarker | undefined;

      // Several events in the same place share one marker.
      for (const group of groupByPlace(events)) {
        const { latitude, longitude } = group[0];
        const marker = L.circleMarker([latitude, longitude], {
          radius: 7 + Math.min(group.length - 1, 4) * 2,
          color: "#ffffff",
          weight: 2,
          fillColor: accent,
          fillOpacity: 0.9,
        })
          .bindPopup(() => popupContent(group, detailsLabel))
          .addTo(map);
        markers.push(marker);
        if (group.some((event) => event.id === focusId)) focused = marker;
      }

      if (focused) {
        map.setView(focused.getLatLng(), 10);
        focused.openPopup();
      } else if (markers.length > 0) {
        map.fitBounds(L.featureGroup(markers).getBounds(), { padding: [30, 30], maxZoom: 10 });
      }
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [events, focusId, attribution, detailsLabel]);

  return (
    <div
      ref={container}
      className="h-[65vh] min-h-80 w-full overflow-hidden rounded-xl border border-border"
    />
  );
}

function groupByPlace(events: MapEvent[]): MapEvent[][] {
  const groups = new Map<string, MapEvent[]>();
  for (const event of events) {
    const key = `${event.latitude.toFixed(4)},${event.longitude.toFixed(4)}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.values()];
}

/** Built with DOM nodes (not HTML strings) so event names can't inject markup. */
function popupContent(events: MapEvent[], detailsLabel: string): HTMLElement {
  const list = document.createElement("ul");
  list.style.cssText = "margin:0;padding:0;list-style:none;max-height:14rem;overflow:auto";
  for (const event of events) {
    const item = document.createElement("li");
    item.style.cssText = "margin:0 0 .5rem";
    const name = document.createElement("strong");
    name.textContent = event.name;
    const dates = document.createElement("div");
    dates.textContent = event.dates;
    const link = document.createElement("a");
    link.href = `/concurs/${event.id}`;
    link.textContent = `${detailsLabel} →`;
    item.append(name, dates, link);
    list.append(item);
  }
  return list;
}
