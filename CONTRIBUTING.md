# Contributing to Storytiva

Thanks for your interest in Storytiva. The project is at the documentation and product-definition stage, so feedback on the problem, MVP scope, accessibility, privacy, and author workflows is especially useful.

## Before starting work

- Check the repository's open issues and pull requests for related work.
- For a significant change, open an issue first so the scope can be discussed.
- Keep contributions focused and explain the author problem they address.

## Pull requests

- Work on a branch; do not push directly to `main`.
- Describe the change and its motivation.
- Link the related issue when one exists.
- Include screenshots or examples for user-facing changes when helpful.
- Update documentation when product behavior or decisions change.

## Privacy and security

Never commit manuscripts, private author material, credentials, API keys, or other secrets. Use synthetic examples in issues and pull requests. Report suspected security vulnerabilities privately to the repository maintainers rather than posting exploit details publicly.

## Development workflow

The app uses Next.js, TypeScript, and npm. Use Node.js 20.9 or newer.

```bash
npm ci
npm run dev
```

Before opening a pull request, run `npm run lint`, `npm run typecheck`, and `npm run build`. Automated application tests have not been configured yet.

