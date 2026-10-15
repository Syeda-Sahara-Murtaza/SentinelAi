"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { SentinelWordmark } from "@/components/SentinelLogo";
import { DashboardProvider, useDashboard } from "@/components/DashboardProvider";
import { LayoutDashboard, MessageSquare, Link2, QrCode, Mic, Cookie, Clock, Shield, Settings, Menu, X, ArrowUpRight, RefreshCw, AlertCircle, Laptop, Cloud } from "lucide-react";

export const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Message analyzer", href: "/dashboard/analyzer", icon: MessageSquare },
  { label: "URL intelligence", href: "/dashboard/url", icon: Link2 },
  { label: "QR guardian", href: "/dashboard/qr", icon: QrCode },
  { label: "Voice guard", href: "/dashboard/voice", icon: Mic },
  { label: "Cookie guardian", href: "/dashboard/privacy", icon: Cookie },
  { label: "Scan history", href: "/dashboard/history", icon: Clock },
  { label: "Trust summary", href: "/dashboard/trust-score", icon: Shield },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];
function SidebarNav({ locale, pathname, close }: { locale: string; pathname: string; close: () => void }) { return <nav aria-label="Dashboard navigation" className="space-y-1 p-4">{navigation.map((item, i) => {
    const href = `/${locale}${item.href}`; const active = pathname === href;
    return <div key={item.href}>{(i === 1 || i === 6) && <p className="px-3 pb-2 pt-6 text-[10px] font-semibold tracking-[0.16em] text-text-muted uppercase">{i === 1 ? "Protection tools" : "Your workspace"}</p>}<a href={href} onClick={close} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${active ? "bg-accent-blue/12 text-accent-blue ring-1 ring-accent-blue/15" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"}`}><item.icon size={17}/>{item.label}{active && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-accent-blue"/>}</a></div>;
  })}</nav>; }

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const locale = useLocale();
  const { state, ready, refreshing, refresh, warning, preferences } = useDashboard();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const current = navigation.find(n => pathname === `/${locale}${n.href}`);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  const Brand = <a href={`/${locale}`} className="flex h-20 items-center border-b border-border-subtle px-6"><SentinelWordmark/></a>;
  return <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-border-subtle bg-surface/70 lg:flex">{Brand}<div className="flex-1 overflow-auto"><SidebarNav locale={locale} pathname={pathname} close={() => setOpen(false)}/></div><div className="m-4 rounded-xl border border-border-subtle p-4"><Shield size={20} className="mb-2 text-accent-cyan"/><p className="text-xs font-medium">Think before you trust.</p><p className="mt-1 text-xs leading-relaxed text-text-muted">A second opinion for your digital world.</p><a className="mt-3 flex items-center gap-2 text-xs text-accent-blue" href={`/${locale}`}>About Sentinel <ArrowUpRight size={13}/></a></div></aside>
    <dialog ref={dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r border-border-subtle bg-surface text-text-primary backdrop:bg-black/70"><div className="flex items-center justify-between px-5 py-5"><SentinelWordmark/><button aria-label="Close navigation" onClick={() => setOpen(false)} className="p-2"><X size={20}/></button></div><SidebarNav locale={locale} pathname={pathname} close={() => setOpen(false)}/></dialog>
    <div className="min-w-0">
      <header className="flex h-20 items-center justify-between gap-3 border-b border-border-subtle bg-navy-950/90 px-4 sm:px-8">
        <div className="flex items-center gap-3"><button className="p-2 lg:hidden" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={21}/></button><div><p className="text-[11px] text-text-muted">Sentinel workspace</p><p className="mt-0.5 text-sm font-medium">{current?.label ?? "Dashboard"}</p></div></div>
        <div className="flex items-center gap-3"><span className="hidden items-center gap-2 rounded-full border border-border-subtle px-3 py-1.5 text-xs text-text-secondary sm:flex">{state.mode === "cloud" ? <Cloud size={13}/> : <Laptop size={13}/>} {ready ? state.mode === "cloud" ? "Account history" : "Browser history" : "Connecting…"}</span><button className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover" onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh dashboard"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""}/></button><a aria-label="Open settings" href={`/${locale}/dashboard/settings`} className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-blue/20 bg-accent-blue/10 text-xs font-semibold text-accent-blue">{(preferences.fullName || "S").slice(0,2).toUpperCase()}</a></div>
      </header>
      <main id="main-content" className="p-4 sm:p-6 lg:p-8">
        {warning && <div role="alert" className="mx-auto mb-6 flex max-w-6xl gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-200"><AlertCircle size={18} className="shrink-0 mt-0.5"/><span>{warning}</span></div>}
        {children}
      </main>
    </div>
  </div>;
}
export default function DashboardShell({ children }: { children: React.ReactNode }) { return <DashboardProvider><Shell>{children}</Shell></DashboardProvider>; }
