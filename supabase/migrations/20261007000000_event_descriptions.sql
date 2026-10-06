-- Short descriptions written by AI from facts on the organizer's website
-- (scraper: npm run describe). Every claim is backed by quotes from that page,
-- stored in description_evidence so a reviewer can check them.
alter table events
  add column description text,
  add column description_evidence jsonb,
  add column description_source_url text,
  add column description_generated_at timestamptz;
