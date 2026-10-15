import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { NextIntlClientProvider } from "next-intl";
import DashboardShell, { navigation } from "@/components/DashboardShell";
import messages from "../messages/en.json";

vi.mock("next/navigation", () => ({ usePathname: () => "/en/dashboard" }));

beforeEach(() => {
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({
    scope: "test-user", mode: "cloud", name: "", email: "test@example.test",
    aiConfigured: false, authConfigured: true, scans: [], preferences: null, warning: "",
  })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function renderDashboard() {
  render(<NextIntlClientProvider locale="en" messages={messages}><DashboardShell><p>Workspace content</p></DashboardShell></NextIntlClientProvider>);
  await screen.findByText("Account history");
}

describe("Dashboard navigation", () => {
  it("leaves every sidebar destination available to normal browser navigation", async () => {
    await renderDashboard();
    const desktopNav = document.querySelector('aside nav')!;
    for (const item of navigation) {
      const link = desktopNav.querySelector(`a[href="/en${item.href}"]`)!;
      expect(link).toHaveTextContent(item.label);
      const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
      fireEvent(link, click);
      expect(click.defaultPrevented).toBe(false);
    }
  });

  it("opens mobile navigation and closes it without canceling the chosen link", async () => {
    await renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = document.querySelector("dialog")!;
    expect(dialog.open).toBe(true);
    const link = dialog.querySelector('a[href="/en/dashboard/history"]')!;
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    fireEvent(link, click);
    expect(click.defaultPrevented).toBe(false);
    expect(dialog.open).toBe(false);
  });
});
