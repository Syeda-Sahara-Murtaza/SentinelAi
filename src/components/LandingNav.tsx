"use client";

import { useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SentinelWordmark } from "./SentinelLogo";
import { Menu, X } from "lucide-react";

const navItems = [
  { key: "platform", href: "#platform" },
  { key: "protection", href: "#protection" },
  { key: "intelligence", href: "#intelligence" },
  { key: "security", href: "#security" },
  { key: "about", href: "#about" },
];

export function LandingNav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const menu = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => { if (menu.current) menu.current.open = false; };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-navy-950/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8" aria-label="Main navigation">
        <a href={`/${locale}`} className="flex-shrink-0">
          <SentinelWordmark />
        </a>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {t(item.key as "platform" | "protection" | "intelligence" | "security" | "about")}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a href={`/${locale}/dashboard`} className="sentinel-btn-secondary text-sm">
            My workspace
          </a>
          <a href={`/${locale}/dashboard`} className="sentinel-btn-primary text-sm">
            Open dashboard
          </a>
        </div>

        {/* Native disclosure and anchors also work before JavaScript loads. */}
        <details ref={menu} className="group md:hidden">
          <summary aria-label="Toggle navigation menu" className="cursor-pointer list-none rounded-lg p-2 text-text-secondary [&::-webkit-details-marker]:hidden">
            <Menu size={20} className="group-open:hidden" />
            <X size={20} className="hidden group-open:block" />
          </summary>
          <div className="absolute inset-x-0 top-full flex max-h-[80dvh] flex-col gap-3 overflow-auto border-t border-border-subtle bg-navy-950 px-4 py-4 shadow-xl">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="text-sm text-text-secondary transition-colors hover:text-text-primary py-2"
                onClick={closeMenu}
              >
                {t(item.key as "platform" | "protection" | "intelligence" | "security" | "about")}
              </a>
            ))}
            <hr className="border-border-subtle" />
            <a href={`/${locale}/dashboard`} className="sentinel-btn-secondary text-sm w-full" onClick={closeMenu}>
              My workspace
            </a>
            <a href={`/${locale}/dashboard`} className="sentinel-btn-primary text-sm w-full" onClick={closeMenu}>
              Open dashboard
            </a>
          </div>
        </details>
      </nav>
    </header>
  );
}
