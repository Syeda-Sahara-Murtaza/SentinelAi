# Sentinel AI

A digital safety workspace for suspicious messages, URLs, QR destinations, voice recordings, and website privacy headers.

**Live website:** https://sentinel-ai-guard.burhanmalik102000.chatgpt.site

This is the latest Sites-hosted source, including the working dashboard, navigation fixes, account history, settings, and Groq integration. The application uses Vinext, React, Next.js-compatible APIs, Cloudflare Workers, and D1. ChatGPT Sites provides production authentication.

## Features

| Feature | Implementation |
| --- | --- |
| Message analyzer | Groq AI analysis, with basic pattern checks as a fallback |
| URL intelligence | URL-structure checks and optional AI assessment |
| QR guardian | Local QR decoding followed by destination analysis |
| Voice guard | Groq Whisper transcription and analysis of uploaded audio; pasted transcripts are also supported |
| Cookie guardian | Checks available website response headers and explains the limits |
| Dashboard | Counts and summaries calculated from the signed-in account's scans |
| Scan history | Filters, report details, JSON export, and account-scoped deletion |
| Settings | Saved display name and preferred AI explanation language |

The homepage illustration is labeled **Demo Data** and is separate from real scan history. Deepfake detection is a planned feature. The interface is currently English; the analysis language setting requests explanations in that language from the AI provider. Risk scores and confidence are estimates, not guarantees.

## Upload to GitHub

1. Extract `SENTINEL-AI-main.zip`.
2. Create a GitHub repository, for example `sentinel-ai`.
3. Upload the **contents of the extracted folder**. `README.md`, `package.json`, `src/`, and the other files should be at the repository root. Include the configuration files that begin with a dot.
4. Commit the files. Uploading only the ZIP stores an archive rather than displaying the source as a project.

You can also use Git from inside the extracted folder to include all configuration files:

```bash
git init
git add .
git commit -m "Add Sentinel AI source"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sentinel-ai.git
git push -u origin main
```

Replace `YOUR_USERNAME` and create an empty repository for this sequence. Uploading the source does not automatically redeploy the live website. GitHub Pages alone cannot host this server and database application.

## Runtime configuration

| Setting | Purpose |
| --- | --- |
| Node.js | Version 22.13 or newer, as declared in `package.json` |
| pnpm | Version 11.25.0, matching the `packageManager` field |
| `GROQ_API_KEY` | Server-only secret for AI analysis and uploaded-audio transcription |
| `GROQ_MODEL` | Optional chat model override; defaults to `openai/gpt-oss-120b` |
| D1 binding `DB` | Stores account history and preferences |

Audio transcription uses `whisper-large-v3-turbo` in `src/lib/ai/provider.ts`.

The live Site's key remains in its encrypted runtime settings. **No actual key is included in this archive.** A separate deployment needs its own secrets. Never put a key in browser code, a public repository, or a variable prefixed with `NEXT_PUBLIC_`.

Blank `.env.example` and `.dev.vars.example` templates are included. For local development, copy `.env.example` to `.env.local` and configure server values. Cloudflare Worker tooling also supports local secrets through `.dev.vars`. If using both files, keep their values consistent. The real configuration files are ignored by Git.

Without a working provider, text and URL analysis fall back to basic checks and explain that limitation. Uploaded-audio transcription requires a working Groq connection.

## Development and checks

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The dependency policy asks for an explicit decision about native dependency build scripts. If installation reports `ERR_PNPM_IGNORED_BUILDS`, run `pnpm approve-builds`, review the packages, and repeat installation. This export preserves that policy.

A clean checkout uses the portable development profile with a test identity on loopback addresses. Production authentication is supplied by Sites. Persistent local history also requires the local D1 schema. Its migration is in `drizzle/0000_illegal_whiplash.sql`; Sites applies migrations during hosted deployment.

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm test:runtime
```

The published source passed six navigation interaction tests, type checking, its production build, and 18 isolated Worker checks. `test:runtime` requires a build and uses a temporary database with fixture users. It covers page rendering, sign-in links, saved scans, preferences, and account isolation; it does not access production records or call a paid AI provider.

The owner confirmed that live AI analysis worked after adding the Groq key. Automated full-browser verification and a live audio transcription test were not completed in the authoring environment.

## Hosting architecture

- `.openai/hosting.json` identifies the existing Site and its `DB` binding. The project identifier is configuration, not a credential.
- `vite.config.ts` configures Vinext and Cloudflare Workers. Its local D1 database identifier is a placeholder; Sites supplies the deployed binding.
- `db/schema.ts` defines the tables; `drizzle/` contains migrations, not real account data.
- `src/lib/site-auth.ts` reads trusted identity supplied by Sites. Data access is scoped to the signed-in user.
- `build/` and `scripts/` contain required integration sources and should remain in the repository.

This is the **Sites-hosted version**, rather than the earlier standalone Next.js/Supabase variant. Moving to another host requires adapting authentication and database bindings. An independent server must not trust identity headers sent directly by public clients.

## Included files

| Directory | Contents |
| --- | --- |
| `src/app/` | Pages, API routes, and styles |
| `src/components/` | Navigation, dashboard state, history, and results |
| `src/lib/` | AI, fallback rules, validation, storage, and security helpers |
| `messages/` | Interface messages |
| `db/`, `drizzle/` | Database schema and migrations |
| `build/`, `scripts/` | Runtime and build integration |
| `tests/` | Navigation and Worker checks |

Installed dependencies, generated builds, caches, Git credentials, runtime secrets, and real database records are excluded. `EXPORT_INFO.json` records the published source commit. Existing third-party notices are retained; this export does not assign a new license to the application.
