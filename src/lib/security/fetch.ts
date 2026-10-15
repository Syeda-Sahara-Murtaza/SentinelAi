import { validateUrl, isPrivateIP } from "@/lib/security";
import { Errors } from "@/lib/errors";
// Workers restrict private-network fetches; also validate DNS and every redirect here.
export async function safeFetchHeaders(raw: string): Promise<Response> {
  let url = validateUrl(raw);
  const signal = AbortSignal.timeout(12000);
  for (let hop = 0; hop <= 4; hop++) {
    if (url.username || url.password || url.port && !["80","443"].includes(url.port)) throw Errors.urlSecurity("Only standard public web addresses can be checked.");
    if (!/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
      const dns = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(url.hostname)}&type=A`, { headers: { Accept: "application/dns-json" }, signal });
      if (!dns.ok) throw Errors.network("Could not verify the destination’s public address.");
      const answer = await dns.json() as { Answer?: { type: number; data: string }[] };
      const addresses = answer.Answer?.filter(a => a.type === 1) ?? [];
      if (!addresses.length || addresses.some(a => isPrivateIP(a.data))) throw Errors.urlSecurity("This website does not resolve to an allowed public address.");
    }
    const response = await fetch(url.href, { redirect: "manual", headers: { "User-Agent": "SentinelAI-PrivacyCheck/1.0", Accept: "text/html" }, signal });
    await response.body?.cancel();
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || hop === 4) throw Errors.network("Too many or invalid website redirects.");
      url = validateUrl(new URL(location,url).href); continue;
    }
    if (!response.ok) throw Errors.network(`The website returned HTTP ${response.status}. No privacy assessment was made.`);
    return response;
  }
  throw Errors.network("The website could not be checked.");
}
