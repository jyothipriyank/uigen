# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # First-time setup: install deps, generate Prisma client, run migrations
npm run dev            # Start dev server with Turbopack at http://localhost:3000
npm run build          # Production build
npm run lint           # ESLint
npm run test           # Run all tests (Vitest)
npx vitest run <file>  # Run a single test file
npm run db:reset       # Reset SQLite database (force)
npx prisma generate    # Regenerate Prisma client after schema changes
npx prisma migrate dev # Apply schema migrations in development
```

## Architecture

UIGen is a Next.js 15 App Router app that lets users generate React components via AI chat, with live preview in an iframe.

### Core data flow

1. User types a prompt → `ChatContext` (`src/lib/contexts/chat-context.tsx`) calls `/api/chat` via Vercel AI SDK's `useChat`
2. The API route (`src/app/api/chat/route.ts`) runs `streamText` with two tools: `str_replace_editor` and `file_manager`
3. As the AI calls tools, `onToolCall` in `ChatContext` dispatches to `FileSystemContext.handleToolCall`
4. `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) mutates the in-memory `VirtualFileSystem` and increments `refreshTrigger`
5. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) watches `refreshTrigger`, recompiles files via `createImportMap` + Babel, and rewrites the iframe's `srcdoc`

### Virtual file system

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree (no disk writes). It serializes to/from `Record<string, FileNode>` for API requests and Prisma storage. The AI operates on this FS through two tools:
- `str_replace_editor` — create/view/str_replace/insert
- `file_manager` — rename/delete

### Preview pipeline

`src/lib/transform/jsx-transformer.ts` handles client-side compilation:
- Babel standalone transforms JSX/TSX → JS
- Each file becomes a blob URL; an import map wires them together
- Third-party packages resolve via `https://esm.sh/<package>`
- Missing local imports get placeholder stub modules so the preview doesn't crash
- Tailwind CDN is injected into the preview iframe

### Auth

JWT-based sessions stored in an httpOnly cookie (`auth-token`). `src/lib/auth.ts` is `server-only`. Anonymous users can work without an account; their state is kept in `sessionStorage` via `anon-work-tracker.ts`. On sign-up, anon work can be claimed.

### AI provider

`src/lib/provider.ts` exports `getLanguageModel()`. When `ANTHROPIC_API_KEY` is absent it returns a `MockLanguageModel` that produces static component code without hitting the API. The real model is `claude-haiku-4-5`.

### Persistence

Prisma + SQLite (`prisma/dev.db`). The `Project` model stores the full message history and virtual FS snapshot as JSON strings. Prisma client is generated into `src/generated/prisma/`. Anonymous users' projects are not persisted to the DB; only authenticated users get DB-backed projects.

### Route structure

- `/` — anonymous home or redirect to most-recent project for auth'd users
- `/[projectId]` — authenticated project view; loads saved messages + FS data
- `/api/chat` — streaming AI endpoint (POST, max 120s)

### Testing

Vitest with jsdom + React Testing Library. Tests live in `__tests__/` directories co-located with source. The `@/` path alias is resolved via `vite-tsconfig-paths`.

## Code style

Comments: use sparingly. Only add one when the code is genuinely complex or non-obvious — a subtle invariant, a hidden constraint, or a non-trivial workaround. Skip anything that well-named identifiers already explain.
