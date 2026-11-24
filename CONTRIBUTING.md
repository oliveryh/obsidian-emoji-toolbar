# Contributing

Thanks for your interest in improving Emoji Toolbar! Bug reports, feature requests and pull requests are all welcome.

## Reporting issues

Please [open an issue](https://github.com/oliveryh/obsidian-emoji-toolbar/issues) and include:

- your Obsidian version and platform (desktop or mobile)
- the plugin version
- steps to reproduce, and what you expected to happen
- whether the **Twitter Emoji** setting is on, if it's relevant

## Development setup

You'll need [Node.js](https://nodejs.org/) (a current LTS release) and npm.

```sh
git clone https://github.com/oliveryh/obsidian-emoji-toolbar.git
cd obsidian-emoji-toolbar
npm ci
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Lint, then rebuild `main.js` on every change |
| `npm run build` | Lint, type-check, then produce a production `main.js` |
| `npm run build:nolint` | Production build without the lint and type-check steps |
| `npm run lint` | Lint `src` with [Biome](https://biomejs.dev/) |
| `npm run typecheck` | Type-check with `tsc --noEmit` |

### Trying your changes in Obsidian

1. Create or open a test vault (don't use one with notes you care about).
2. Copy `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/obsidian-emoji-toolbar/`.
3. In Obsidian, enable community plugins, then enable **Emoji Toolbar** (or reload it if it's already enabled).
4. Assign a hotkey to **Emoji Toolbar: Open emoji picker** and check the picker opens, searches and inserts emojis.
5. Toggle **Twitter Emoji** in the plugin settings and check the picker and reading view.

## Pull requests

- Branch from `main` and keep each pull request focused on one change.
- Make sure `npm run build` passes before opening the PR.
- Prefer small, atomic commits. Commit messages in this repo use a leading [gitmoji](https://gitmoji.dev/) followed by a conventional type, for example `:bug: fix: unmount react tree when the modal closes`.
- Describe what changed and how you tested it. If the change affects what users see, say which platforms you tried.

## Releasing (maintainers)

Releases are built from source by the [Release workflow](.github/workflows/release.yml); don't upload `main.js` by hand.

1. Bump the version in a pull request, without a `v` prefix:
   - `npm version <x.y.z> --no-git-tag-version` (updates `package.json` and `package-lock.json`)
   - set the same `version` in `manifest.json`
   - add `"<x.y.z>": "<minAppVersion>"` to `versions.json`
2. Merge to `main`, then tag the merge commit with the exact version and push the tag:
   ```sh
   git tag <x.y.z>
   git push origin <x.y.z>
   ```
3. The workflow checks the tag matches `manifest.json`, `package.json` and `versions.json`, runs `npm ci` and `npm run build`, attests build provenance for `main.js`, `manifest.json` and `styles.css`, and creates a **draft** release.
4. Review the draft release notes and assets on GitHub, then publish it.

## License

By contributing, you agree that your contributions will be licensed under the [BSD-3-Clause license](LICENSE).
