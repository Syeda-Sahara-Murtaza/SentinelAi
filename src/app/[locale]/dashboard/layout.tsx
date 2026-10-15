import DashboardShell from "@/components/DashboardShell";
import { SentinelWordmark } from "@/components/SentinelLogo";
import { chatGPTSignInPath, getChatGPTUser } from "@/lib/site-auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getChatGPTUser();
  if (!user) {
    return <main className="flex min-h-screen items-center justify-center p-6">
      <section className="sentinel-card w-full max-w-md space-y-6">
        <a href={`/${locale}`} className="inline-flex"><SentinelWordmark /></a>
        <div>
          <h1 className="text-2xl font-semibold">Open your Sentinel workspace</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">Sign in with ChatGPT to run scans and keep your history and settings in your own account.</p>
        </div>
        <a href={chatGPTSignInPath(`/${locale}/dashboard`)} target="_top" className="sentinel-btn-primary w-full">Sign in with ChatGPT</a>
        <a href={`/${locale}#protection`} className="block text-center text-sm text-text-secondary hover:text-text-primary">Explore protection</a>
      </section>
    </main>;
  }
  return <DashboardShell>{children}</DashboardShell>;
}
