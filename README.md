# Storytiva

**An open-source workspace that helps authors spend less effort managing a book and more time writing it.**

Storytiva is an early-stage project for authors who want one dependable place to capture ideas, organize a manuscript gradually, return to their last writing session, and export their work. The product is designed for a bilingual Spanish-English market.

> **Project status:** Core writing loop in progress: email sign-in, book creation, chapter editor, cloud autosave, local draft recovery, and last-position persistence.

## Product direction

The MVP focuses on the everyday work around a manuscript:

- Create a book project and return to the last active passage.
- Write in chapters and sections with visible save status.
- Capture loose ideas without first assigning a title, chapter, or tag.
- Reorder chapters and move ideas into the manuscript.
- Resume with the last writing point, recent notes, and author-selected next steps.
- Keep named versions and restore an earlier version safely.
- Export the manuscript and notes to DOCX and Markdown.

AI assistance is optional and should present suggestions separately so the author remains in control of the manuscript.

## Roadmap

| Capability | Planned priority | Direction |
| --- | --- | --- |
| Outline Generator | P1 | Draft, edit, compare, and reorder a chapter-by-chapter outline. |
| Writing Studio | P1 | Import a DOCX or Markdown draft and convert it into an editable book structure while preserving the source. |
| Niche Hunter | P2 | Research a topic or niche with dated, traceable sources and clearly labeled estimates. |
| Book Formatter | P2 | Preview styles and prepare exports for selected digital or print formats. |
| Cover Generator | P3 | Create and refine cover options without changing the manuscript. |
| Book Trailers | P3 | Prepare an author-approved storyboard and short promotional video. |

Roadmap inclusion is not a promise of immediate availability or guaranteed market, sales, or ranking data.

## Local setup

Requirements: Node.js 20.9 or newer and npm 10.9.2.

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and set the project URL, publishable key, and site URL.
3. Run the SQL files in `supabase/migrations/` in filename order. If the initial book schema is already installed, run only the newer migration that has not been applied.
4. In Supabase Authentication URL Configuration, add `http://localhost:3000/auth/callback` to the allowed redirect URLs. Set the production callback URL after deployment.
5. Install and start the app:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Sign in with a magic link, create a book, start writing, and capture unsorted ideas from the editor. Supabase Auth email delivery limits may apply until custom SMTP is configured.

## Security and data

The Supabase migration enables row-level security and scopes book records, chapters, ideas, positions, and versions to their owner. The Supabase service-role key is not used by the application. Local unsaved drafts are held in this browser's IndexedDB; clearing browser data removes those local copies. Automatic checkpoints are created at most once every fifteen minutes per chapter, named milestones can be created from the editor, and restoring a version first saves the current text as a recovery point.

## Product principles

- **The author owns the work.** Generated text is a proposal; it never replaces accepted writing without explicit approval.
- **Writing should be easy to resume.** Open a project at the active editor or last point of work.
- **Organization can happen gradually.** Authors can capture ideas before deciding where they belong.
- **The manuscript is critical data.** Saving, recovery, versions, and export are core product concerns.
- **AI stays optional and understandable.** Context, estimated cost, and controls should be visible before a generation task.

## License

Storytiva is intended to be open source under the MIT License. See [LICENSE](LICENSE).
