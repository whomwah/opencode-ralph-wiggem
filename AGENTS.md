# AGENTS.md - Ralph Wiggum OpenCode Plugin

Guidelines for AI coding agents working in this repository.

## Project Overview

TypeScript plugin for OpenCode implementing the Ralph Wiggum iterative development loop. Uses Bun as the runtime.

- **Language**: TypeScript (strict mode)
- **Runtime**: Bun v1.0+
- **Module System**: ES Modules (`"type": "module"`)
- **Main Export**: `RalphWiggumPlugin` from `src/index.ts`

## Build/Lint/Test Commands

```bash
bun run build           # Build plugin to dist/
bun run build:types     # Generate TypeScript declarations
bun run typecheck       # Run TypeScript type checking (tsc --noEmit)
bun run dev             # Watch mode - rebuilds on changes
bun run link:local      # Symlink to ~/.config/opencode/plugin/
```

### Testing

No test suite exists. When adding tests:

- Use Bun's built-in test runner: `bun test`
- Run single test file: `bun test path/to/file.test.ts`
- Run tests matching pattern: `bun test --filter "pattern"`

### Formatting

```bash
bun run format          # Format all files with Prettier
bun run format:check    # Check formatting without modifying
```

### Linting

No linter configured. If adding one, prefer Biome or ESLint.

## Project Structure

```
src/index.ts          # All plugin logic (~400 lines, single file)
dist/                 # Built output (gitignored)
package.json          # Scripts and dependencies
tsconfig.json         # TypeScript config (ESNext, strict, bundler resolution)
```

## Code Style Guidelines

### Imports

Order by category, use `type` keyword for type-only imports:

```typescript
// External packages first
import { type Plugin, tool } from "@opencode-ai/plugin"
// Node.js built-ins second (prefer namespace imports)
import * as fs from "fs"
import * as path from "path"
```

### Naming Conventions

| Type          | Convention           | Example                      |
| ------------- | -------------------- | ---------------------------- |
| Constants     | SCREAMING_SNAKE_CASE | `RALPH_STATE_FILE`           |
| Interfaces    | PascalCase           | `RalphState`                 |
| Functions     | camelCase            | `readState`, `writeState`    |
| Plugin export | PascalCase           | `RalphWiggumPlugin`          |
| Tool names    | kebab-case           | `ralph-loop`, `cancel-ralph` |

### Formatting

- No semicolons
- 2-space indentation
- Template literals for multi-line strings
- Use `null` over `undefined` for optional state values

### State Management

State stored at `.opencode/ralph-loop.local.json`. Always create parent directories before writing.

## How OpenCode Discovers Plugins

OpenCode loads plugins from two locations at startup:

| Location | Scope          | Path                         |
| -------- | -------------- | ---------------------------- |
| Global   | All projects   | `~/.config/opencode/plugin/` |
| Project  | Single project | `.opencode/plugin/`          |

The `link:local` script symlinks `dist/index.js` to the global plugin directory. We link to `dist/` (not `src/`) because the build bundles all dependencies.

**After making changes**: Run `bun run build`, then restart OpenCode.

## Commit Messages

Use Semantic Commit Message style: `type(scope): subject`

- **type**: feat, fix, docs, style, refactor, test, chore
- **scope**: Optional area affected
- **subject**: Imperative mood, lowercase, no period
