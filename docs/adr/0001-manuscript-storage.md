# ADR-0001: Manuscript storage and initial data model

- **Status:** Accepted for storage strategy; initial data model proposed for implementation review
- **Date:** 2026-11-26
- **Decision owners:** Storytiva maintainers

## Context

Storytiva must make it easy to resume writing while protecting the manuscript as critical user data. The internal MVP should stay small, but its persistence model should support a later multi-customer product. The PRD calls for visible autosave, recovery, versions, export, private projects, and author control over manuscript data.

## Decision

1. Use a managed PostgreSQL database as the canonical store for accounts, book metadata, manuscript structure and text, ideas, writing positions, and version snapshots.
2. Use browser IndexedDB as a recovery buffer for edits that have not yet been acknowledged by the server. Remove a pending edit only after the server confirms it has been stored.
3. Scope the MVP to one active editor per book at a time. Do not build simultaneous collaboration or full offline multi-device synchronization in the first increment.
4. Autosave after a short idle interval. Each write carries a document revision and idempotency key. If the server reports a stale revision, preserve the local draft and ask the author how to recover it; never silently overwrite manuscript text.
5. Keep text and structured manuscript data in PostgreSQL. Do not introduce object storage for manuscript text. Add object storage later for binary uploads and generated assets such as original DOCX files, covers, and trailers.
6. Keep database-provider choice separate from this decision. The implementation should use standard PostgreSQL capabilities and avoid provider-specific storage APIs in the domain model.

## Initial logical data model

This is a proposal for the first implementation. It defines product concepts without committing to a database vendor or a specific editor library.

| Entity | Purpose | Initial fields |
| --- | --- | --- |
| `users` | Author identity, supplied by the selected authentication system. | `id` |
| `books` | A writing project owned by one author. | `id`, `owner_id`, `title`, `language` (`es` or `en`), `created_at`, `updated_at` |
| `book_nodes` | Ordered manuscript structure. A node can be a part, chapter, or section. | `id`, `book_id`, `parent_id`, `kind`, `title`, `position`, `content`, `content_schema_version`, `revision`, timestamps |
| `ideas` | Quick-captured material that can stay in an inbox or be linked into the manuscript. | `id`, `book_id`, `body`, `status`, `linked_node_id`, `position`, timestamps |
| `book_positions` | Per-author continuation point when reopening a book. | `book_id`, `user_id`, `active_node_id`, `cursor_anchor`, `updated_at` |
| `book_versions` | Restorable named or automatic checkpoints, not one record per keystroke. | `id`, `book_id`, `created_by`, `label`, `snapshot`, `schema_version`, `checksum`, `created_at` |

### Relationship and behavior notes

- Every book belongs to one `owner_id`; child records are authorized through their `book_id`. Enforce this on the server and, where available, with database row-level security.
- `book_nodes.parent_id` supports a shallow hierarchy for parts, chapters, and sections. The MVP should validate allowed parent/child combinations rather than permit arbitrary nesting.
- Store manuscript content in a canonical, versioned document representation. Prefer a structured representation over editor-generated HTML so exports and future editor changes can be handled deliberately. Select the exact format after choosing the editor.
- The editor's current revision increments on each accepted server save. Clients submit the revision they edited; a mismatch triggers recovery instead of a last-write-wins replacement.
- Create snapshots at explicit checkpoints and at a controlled recovery interval. Autosave updates the current node; it does not create an unbounded version for each edit.
- Use indexes for book ownership and update time, node order within a parent, ideas by book and status, and versions by book and creation time.
- Browser recovery data is temporary and local to that browser profile. It is not the canonical copy and should be visible to the author when a save is pending or has failed.
- Provide a full export so the author can retain a portable copy of the manuscript and ideas.

## Consequences

### Benefits

- Cloud persistence supports account-based access and later use across devices without introducing multi-user editing.
- IndexedDB gives a recovery path for brief connection loss while keeping synchronization rules narrow.
- PostgreSQL can store the structured text and metadata without a separate file-storage service in the MVP.
- Revision checks protect the manuscript from silent overwrites.

### Costs and constraints

- The first usable pilot needs authentication, server-side authorization, backups, and a recovery experience.
- The MVP will not support concurrent editing or conflict-free offline synchronization.
- A canonical editor-content format and its migration policy must be selected before implementing the editor.
- Object storage and binary asset lifecycle will need a separate decision when import and media-generation features are implemented.

## Out of scope

- Real-time coauthoring, comments, and reviewer access.
- Full offline editing across multiple devices.
- Vector databases, embeddings, or AI-specific persistence.
- Storage of uploaded manuscripts, cover images, or videos as database blobs.
