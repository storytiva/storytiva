# ADR-0002: Proposed MVP application and editor stack

- **Status:** Proposed; pending maintainer approval
- **Date:** 2026-11-26
- **Decision owners:** Storytiva maintainers

## Context

ADR-0001 selected managed PostgreSQL as the canonical manuscript store and IndexedDB as a local recovery buffer, while leaving the database provider and editor format open. The first implementation needs one application with a rich text editor, authenticated cloud persistence, a versioned document representation, and a path to Markdown and DOCX export. The project is MIT-licensed and should avoid requiring paid editor features for its core writing flow.

## Proposal

Use a small TypeScript web application with these components:

| Concern | Proposed choice | Reason |
| --- | --- | --- |
| Web application | Next.js App Router and TypeScript | One deployable application can serve the interface and the autosave API through Route Handlers; this avoids a separate backend service for the MVP. |
| Editor | Tiptap core with a deliberately small set of open-source extensions | It is a headless React-compatible editor based on ProseMirror. Its document can be read as JSON, which fits the versioned structured-content model. Use MIT-licensed core packages only; do not depend on paid Pro extensions or Tiptap Cloud for the MVP. |
| Managed data and authentication | Supabase Postgres and Supabase Auth | Provides standard PostgreSQL with managed authentication in one service. Keep application data in standard PostgreSQL tables and migrations to preserve portability. |
| Local recovery buffer | Browser IndexedDB through a thin application adapter | Store only pending, unacknowledged edits locally; the server remains canonical. |
| Document payload | Application envelope containing Tiptap JSON plus an application-owned `content_schema_version` | Allows the application to validate and migrate saved documents deliberately instead of depending on raw editor HTML. |

## Implementation constraints

- Store each manuscript node's content as a JSONB document, with an explicit content format and schema version. Validate the payload on the server before saving.
- Keep revisions and idempotency checks in the autosave path. Do not use last-write-wins for manuscript text.
- Use Next.js Route Handlers for writes so the session is checked and expected revisions can be enforced in one server-side flow.
- Use the authenticated user's Supabase session. Never expose a service-role key to the browser.
- Enable and review row-level security and grants on every client-exposed table. Policies must restrict books and their child records to their owner.
- Keep database schema changes in versioned SQL migrations in the repository.
- Do not add a separate storage service for text. Revisit object storage for original manuscript files and generated media when those features enter implementation.
- Confirm the selected Supabase plan's backup/restore behavior before inviting external pilot users; the app must also support a portable author-initiated export.
- Pin dependency versions in the package manager lockfile and review each dependency's license before adoption.

## Alternatives considered

### Lexical

Lexical also represents editor state as a serializable node tree and supports conversion to JSON, HTML, and Markdown. It is a viable alternative. Tiptap is proposed because its React integration and editor-schema workflow appear to fit a conventional structured writing editor with fewer framework-specific decisions. Reconsider if a small prototype reveals accessibility, pagination, input, or export limitations.

### Separate SPA and API

A separate frontend and backend could provide more deployment flexibility, but it creates two applications and an API boundary before the MVP needs them. Defer until independent scaling or deployment becomes valuable.

### Markdown as canonical manuscript content

Markdown is portable and easy to export, but it constrains rich-text editing and later formatting features. Use Markdown as an import/export format, not the canonical editor state.

## Risks and mitigations

- **Editor schema changes:** store an application schema version and add explicit migrations before changing the accepted document structure.
- **Editor coupling:** isolate Tiptap serialization behind a document adapter and keep book metadata, node structure, versioning, and export logic outside editor components.
- **Vendor dependence:** use PostgreSQL migrations and standard SQL; keep provider-specific authentication and deployment behind clear configuration boundaries.
- **Security configuration errors:** enable RLS, set explicit grants and owner policies, and review authorization behavior before storing real manuscripts.
- **Backup assumptions:** verify retention and restore procedures for the chosen plan; do not treat a local IndexedDB buffer as a backup.

## Acceptance criteria for this proposal

- Maintainers approve or revise the editor and hosting choices before implementation starts.
- A short editor spike can create, serialize, reload, and export a chapter containing paragraphs, headings, emphasis, and lists.
- A schema migration approach is documented before real manuscripts are stored.
- The first database migration defines ownership and access constraints alongside tables.

## References

- [Tiptap editor concepts and JSON output](https://tiptap.dev/docs/editor/core-concepts/introduction)
- [Tiptap content migrations and Markdown support](https://tiptap.dev/docs/resources/whats-new)
- [Tiptap core license](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Supabase Database overview](https://supabase.com/docs/guides/database/overview)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
