import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { NextIntlClientProvider } from "next-intl";
import LandingPage from "@/app/[locale]/page";
import messages from "../messages/en.json";

afterEach(cleanup);

function renderLanding() {
  return render(<NextIntlClientProvider locale="en" messages={messages}><LandingPage /></NextIntlClientProvider>);
}

// Verify that the rendered controls leave navigation to the browser. Mocking
// next/link as <a> would hide the intercepted-click failure this covers.
function expectNativeNavigation(link: HTMLElement, href: string) {
  expect(link).toHaveAttribute("href", href);
  const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
  fireEvent(link, click);
  expect(click.defaultPrevented).toBe(false);
}

describe("Landing navigation", () => {
  it("opens the analyzer directly without intercepting the click", () => {
    renderLanding();
    expectNativeNavigation(screen.getByRole("link", { name: /analyze a threat/i }), "/en/dashboard/analyzer");
  });

  it("links Explore Protection to an existing section below the fixed header", () => {
    renderLanding();
    expectNativeNavigation(screen.getByRole("link", { name: /explore protection/i }), "#protection");
    expect(document.querySelector("section#protection")).toBeInTheDocument();
  });

  it("opens the workspace from both desktop and mobile navigation", () => {
    renderLanding();
    for (const name of ["My workspace", "Open dashboard"]) {
      for (const link of screen.getAllByRole("link", { name, hidden: true })) {
        expectNativeNavigation(link, "/en/dashboard");
      }
    }
  });

  it("keeps the mobile menu usable as a native disclosure and closes it on navigation", () => {
    renderLanding();
    const menu = document.querySelector("details")!;
    expect(menu.querySelector("summary")).toHaveAccessibleName("Toggle navigation menu");
    menu.open = true;
    const link = menu.querySelector('a[href="/en/dashboard"]')!;
    fireEvent.click(link);
    expect(menu.open).toBe(false);
  });
});
