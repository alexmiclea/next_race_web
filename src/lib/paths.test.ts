import { describe, expect, it } from "vitest";
import { eventLookup, eventPath } from "./paths";

describe("eventPath", () => {
  it("links to the event by its slug", () => {
    expect(eventPath({ slug: "bucharest-marathon-2026" })).toBe("/concurs/bucharest-marathon-2026");
  });
});

describe("eventLookup", () => {
  it("treats readable segments as slugs", () => {
    expect(eventLookup("alergaras-in-fagaras-2027")).toEqual({
      column: "slug",
      value: "alergaras-in-fagaras-2027",
    });
  });

  it("treats old id links as ids", () => {
    const id = "3f2b8c1e-9a4d-4e7f-8b2a-1c5d6e7f8a9b";
    expect(eventLookup(id)).toEqual({ column: "id", value: id });
    expect(eventLookup(id.toUpperCase()).column).toBe("id");
  });

  it("does not mistake a slug containing an id-like part for an id", () => {
    expect(eventLookup("race-3f2b8c1e-9a4d-4e7f-8b2a-1c5d6e7f8a9b").column).toBe("slug");
  });

  it("decodes percent-encoded segments", () => {
    expect(eventLookup("cros%2D2027").value).toBe("cros-2027");
  });

  it("round-trips with eventPath", () => {
    const segment = eventPath({ slug: "timisoara-21k-2027" }).split("/").pop()!;
    expect(eventLookup(segment)).toEqual({ column: "slug", value: "timisoara-21k-2027" });
  });
});
