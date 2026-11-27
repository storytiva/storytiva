# Storytiva

**An open-source workspace that helps authors spend less effort managing a book and more time writing it.**

Storytiva is an early-stage project for authors who want one dependable place to capture ideas, organize a manuscript gradually, return to their last writing session, and export their work. The product is designed for a bilingual Spanish-English market.

> **Project status:** Initial web application scaffold. The core writing workflow is still under development.

## Product direction

The MVP focuses on the everyday work around a manuscript:

- Create a book project and return to the last active passage.
- Write in chapters and sections with visible save status.
- Capture loose ideas without first assigning a title, chapter, or tag.
- Reorder chapters and move ideas into the manuscript.
- Resume with the last writing point, recent notes, and author-selected next steps.
- Keep named versions and restore an earlier version safely.
- Export the manuscript and notes to DOCX and Markdown.

The MVP is intended to make starting, pausing, and resuming a writing session easier. AI assistance is optional and should present suggestions separately so the author remains in control of the manuscript.

## Roadmap

These capabilities are planned in stages and are not part of the initial MVP:

| Capability | Planned priority | Direction |
| --- | --- | --- |
| Outline Generator | P1 | Draft, edit, compare, and reorder a chapter-by-chapter outline. |
| Writing Studio | P1 | Import a DOCX or Markdown draft and convert it into an editable book structure while preserving the source. |
| Niche Hunter | P2 | Research a topic or niche with dated, traceable sources and clearly labeled estimates. |
| Book Formatter | P2 | Preview styles and prepare exports for selected digital or print formats. |
| Cover Generator | P3 | Create and refine cover options without changing the manuscript. |
| Book Trailers | P3 | Prepare an author-approved storyboard and short promotional video. |

Roadmap inclusion is not a promise of immediate availability or guaranteed market, sales, or ranking data.

## Product principles

- **The author owns the work.** Generated text is a proposal; it never replaces accepted writing without explicit approval.
- **Writing should be easy to resume.** Open a project at the active editor or last point of work.
- **Organization can happen gradually.** Authors can capture ideas before deciding where they belong.
- **The manuscript is critical data.** Saving, recovery, versions, and export are core product concerns.
- **AI stays optional and understandable.** Context, estimated cost, and controls should be visible before a generation task.

## Language

The product is intended for Spanish- and English-speaking authors. The repository currently uses English for technical documentation; product interface language support will be defined during MVP design.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the initial contribution guidelines.

## Development setup

Requirements: Node.js 20.9 or newer and npm 10.9.2.

```bash
npm ci
npm run dev
```

The app will be available at `http://localhost:3000`. Supabase environment variables will be added when authentication and cloud persistence are wired into the first writing flow.

## License

Storytiva is intended to be open source under the MIT License. See [LICENSE](LICENSE).

## Product specification

The current product requirements document is maintained separately from this repository. This README summarizes its MVP direction and roadmap; update it when product decisions change.

