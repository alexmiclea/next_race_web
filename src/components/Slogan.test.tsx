import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SITE_NAME, SLOGAN } from "@/lib/site";
import { Slogan } from "./Slogan";

afterEach(cleanup);

describe("Slogan", () => {
  it('reads "Find your next race." in English, whatever the site language', () => {
    render(<Slogan />);
    const slogan = screen.getByText("Find your next race.");
    expect(slogan.getAttribute("lang")).toBe("en");
    expect(SLOGAN).toBe("Find your next race.");
  });

  it("belongs to Racely", () => {
    expect(SITE_NAME).toBe("Racely");
  });
});
