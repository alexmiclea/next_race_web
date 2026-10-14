import { describe, expect, it } from "vitest";
import { CONTACT_EMAIL, CONTACT_PATH } from "./site";

describe("site contact", () => {
  it("uses the site's own address, not a placeholder", () => {
    expect(CONTACT_EMAIL).toBe("contact@racely.ro");
  });

  it("links the footer to the contact section of the About page", () => {
    expect(CONTACT_PATH).toBe("/despre#contact");
  });
});
