import { createRequire } from 'node:module';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve('wrangler/package.json'));
const { Miniflare } = wranglerRequire('miniflare');
// In-process Worker tests only. No browser or user-facing preview is started.
const root = new URL('../dist/server/', import.meta.url).pathname;
const modulePaths = (await readdir(root, { recursive: true })).filter(p => p.endsWith('.js') || p.endsWith('.mjs'));
modulePaths.sort((a,b) => a === 'index.js' ? -1 : b === 'index.js' ? 1 : a.localeCompare(b));
const mf = new Miniflare({
  modules: modulePaths.map(path => ({ type: 'ESModule', path: root + path })),
  modulesRoot: new URL('../dist/server/', import.meta.url).pathname,
  modulesRules: [{ type:'ESModule', include:['**/*.js','**/*.mjs'], fallthrough:true }],
  compatibilityDate:'2026-05-15', compatibilityFlags:['nodejs_compat'],
  d1Databases:['DB'],
});
const headers = user => ({ 'oai-authenticated-user-id':user, 'oai-authenticated-user-email':`${user}@example.test` });
const checks=[];
try {
  const db=await mf.getD1Database('DB');
  const files=(await readdir(new URL('../drizzle/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort();
  for(const file of files) {
    const sql=await readFile(new URL(`../drizzle/${file}`,import.meta.url),'utf8');
    for(const statement of sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean)) await db.prepare(statement).run();
  }
  for(const path of ['/en','/en/dashboard','/en/dashboard/analyzer','/en/dashboard/url','/en/dashboard/qr','/en/dashboard/voice','/en/dashboard/privacy','/en/dashboard/history','/en/dashboard/trust-score','/en/dashboard/settings']) {
    const res=await mf.dispatchFetch(`http://unit.test${path}`,{headers:headers('test-owner')});
    const html=await res.text();
    assert.equal(res.status,200,`${path}: ${html.slice(0,500)}`);
    assert.ok(!html.includes('NEXT_INTL_MESSAGE_FALLBACK'),`${path} translation error`);
    assert.ok(html.includes('Sentinel'),`${path} contains rendered UI`);
    if(path === '/en') {
      assert.match(html, /href="\/en\/dashboard\/analyzer"[^>]*>[\s\S]*?Analyze a Threat/);
      assert.match(html, /href="#protection"[^>]*>Explore Protection/);
      assert.match(html, /<section id="protection"/);
      assert.match(html, /<details/);
    } else {
      assert.ok(!html.includes('Open your Sentinel workspace'),`${path} allows the signed-in account`);
      assert.match(html, /href="\/en\/dashboard\/history"/);
    }
    checks.push(`Rendered ${path}`);
  }
  const visitorPage=await mf.dispatchFetch('http://unit.test/en/dashboard');
  const visitorHtml=await visitorPage.text();
  assert.equal(visitorPage.status,200);
  assert.match(visitorHtml,/Open your Sentinel workspace/);
  assert.match(visitorHtml,/href="\/signin-with-chatgpt\?return_to=%2Fen%2Fdashboard" target="_top"/);
  assert.ok(!visitorHtml.includes('aria-label="Refresh dashboard"'));
  checks.push('Anonymous visitors receive a working top-level sign-in link');
  const initial=await mf.dispatchFetch('http://unit.test/api/dashboard',{headers:headers('test-owner')});
  assert.equal(initial.status,200);assert.equal((await initial.json()).scans.length,0);
  const scan=await mf.dispatchFetch('http://unit.test/api/analyze/text',{method:'POST',headers:{...headers('test-owner'),'Content-Type':'application/json'},body:JSON.stringify({text:'URGENT: send your password and OTP immediately. You won a prize. Pay a fee using gift cards.'})});
  assert.equal(scan.status,200,await scan.clone().text());const result=await scan.json();assert.equal(result.entry.persisted,true);assert.equal(result.result.riskLevel,'high-risk');checks.push('Analyzed message and saved result to D1');
  const history=await (await mf.dispatchFetch('http://unit.test/api/dashboard',{headers:headers('test-owner')})).json();
  assert.equal(history.scans.length,1);assert.equal(history.scans[0].id,result.entry.id);checks.push('Loaded saved account history');
  const other=await (await mf.dispatchFetch('http://unit.test/api/dashboard',{headers:headers('another-test-user')})).json();
  assert.equal(other.scans.length,0);checks.push('Isolated one user’s scans from another user');
  const unauthorized=await mf.dispatchFetch('http://unit.test/api/analyze/text',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'hello'})});
  assert.equal(unauthorized.status,401);checks.push('Rejected unauthenticated analysis');
  const settings=await mf.dispatchFetch('http://unit.test/api/settings',{method:'PATCH',headers:{...headers('test-owner'),'Content-Type':'application/json'},body:JSON.stringify({fullName:'Test owner',analysisLanguage:'ur'})});
  assert.equal(settings.status,200);
  const saved=await (await mf.dispatchFetch('http://unit.test/api/dashboard',{headers:headers('test-owner')})).json();
  assert.equal(saved.preferences.analysisLanguage,'ur');checks.push('Saved and reloaded account preferences');
  await mf.dispatchFetch('http://unit.test/api/history',{method:'DELETE',headers:headers('another-test-user')});
  assert.equal((await (await mf.dispatchFetch('http://unit.test/api/dashboard',{headers:headers('test-owner')})).json()).scans.length,1);checks.push('Prevented cross-user deletion');
  const cleared=await mf.dispatchFetch('http://unit.test/api/history',{method:'DELETE',headers:headers('test-owner')});assert.equal(cleared.status,200);
  assert.equal((await (await mf.dispatchFetch('http://unit.test/api/dashboard',{headers:headers('test-owner')})).json()).scans.length,0);checks.push('Cleared only the authenticated user’s history');
  console.log(JSON.stringify({passed:checks.length,checks},null,2));
} finally { await mf.dispose(); }
