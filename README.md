# readmegen web demo

A web-based demo for [readmegen](https://github.com/Cravex1862/readmegen) — paste any GitHub repo URL to generate a README.

- **Local mode**: uses the full readmegen CLI (clone + analysis + template generation)
- **GitHub Pages mode**: falls back to the GitHub API for a basic file-tree + dependency template

## Run locally

```bash
npm install
node server.js
```

Then open http://localhost:3000
