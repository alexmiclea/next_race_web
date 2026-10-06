-- Coordinates for the map view, filled in by the scraper's geocoding step
-- (OpenStreetMap Nominatim, from city + county). Null for virtual events or unknown places.
alter table events
  add column latitude double precision,
  add column longitude double precision;
