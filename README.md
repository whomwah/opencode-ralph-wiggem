# Ralph Wiggum Plugin for OpenCode (⚠️ work in progress, use at your own risk ⚠️)

Implementation of the Ralph Wiggum technique for iterative, self-referential AI development loops in OpenCode.

## What is Ralph?

Ralph is a development methodology based on continuous AI agent loops. As Geoffrey Huntley describes it: **"Ralph is a Bash loop"** - a simple `while true` that repeatedly feeds an AI agent a prompt file, allowing it to iteratively improve its work until completion.

The technique is named after Ralph Wiggum from The Simpsons, embodying the philosophy of persistent iteration despite setbacks.

### Core Concept

This plugin implements Ralph using OpenCode's `session.idle` event. When the AI finishes, the plugin checks progress and either continues or stops.

**Two modes of operation:**

1. **Plan-based** (`rw-start`): Work through a list of tasks, marking each complete
2. **Direct loop** (`rw-loop`): Hammer at one goal until it succeeds

Both create a **self-referential feedback loop** where:

- The AI's previous work persists in files
- Each iteration sees modified files and output from earlier attempts
- The AI iteratively improves by building on its own work

**Plan-based mode** - for structured projects:

```
# Create PLAN.md with tasks, then:
rw-start

# Loop works through tasks one by one
# Stops when: all tasks marked [x] OR maxIterations reached
```

**Direct loop mode** - for iterative problem-solving:

```
# Start a loop that keeps trying until success:
rw-loop("Make all tests pass", completionPromise: "ALL_TESTS_PASSING", maxIterations: 20)

# Same prompt fed back each iteration
# Stops when: <promise>ALL_TESTS_PASSING</promise> output OR maxIterations reached
```

The direct loop is ideal for tasks like "fix the build", "make tests pass", or "get this working" where you want the AI to keep iterating on the same problem until solved.

## Installation

### From npm (recommended for end users)

Add the plugin to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-ralph-wiggum"]
}
```

OpenCode will automatically install it on startup.

### From source (for development)

```bash
# Clone the repository
git clone https://github.com/whomwah/opencode-ralph-wiggum.git
cd opencode-ralph-wiggum

# Install dependencies
just install

# Link to OpenCode for local development
just link-local    # Global: ~/.config/opencode/plugin/
just link-project  # Project: .opencode/plugin/
```

#### How Local Plugin Loading Works

OpenCode automatically loads plugins from two directories at startup:

1. **Global plugins**: `~/.config/opencode/plugin/` - Available in all projects
2. **Project plugins**: `.opencode/plugin/` - Only available in that project

The `link-local` and `link-project` tasks create **symbolic links** from these directories to the source TypeScript file (`src/index.ts`). This means:

- OpenCode finds the symlink in its plugin directory
- The symlink points to your local source file
- OpenCode loads and executes the TypeScript directly (Bun handles TS natively)
- Changes to `src/index.ts` take effect after restarting OpenCode

```bash
# What link-local actually does:
ln -sf $(pwd)/src/index.ts ~/.config/opencode/plugin/ralph-wiggum.ts

# Result: OpenCode sees ralph-wiggum.ts in its plugin folder
# but it's really reading from your development directory
```

**Important**: Plugins are loaded once at OpenCode startup. After making changes, you must restart OpenCode to see them.

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.0 or later
- [OpenCode](https://opencode.ai) installed

### Setup

```bash
# Clone the repository
git clone https://github.com/whomwah/opencode-ralph-wiggum.git
cd opencode-ralph-wiggum

# Install dependencies
just install

# Type check
just typecheck

# Build for distribution
just build
```

### Project Structure

```
opencode-ralph-wiggum/
├── src/
│   └── index.ts          # Main plugin source
├── dist/                 # Built output (generated)
├── package.json
├── tsconfig.json
└── README.md
```

### Tasks

This project uses [just](https://github.com/casey/just) as a command runner. Run `just` to see all available tasks:

| Task                  | Description                            |
| --------------------- | -------------------------------------- |
| `just install`        | Install dependencies                   |
| `just build`          | Build the plugin for distribution      |
| `just build-types`    | Generate TypeScript declarations       |
| `just build-all`      | Build everything (code + types)        |
| `just dev`            | Watch mode for development             |
| `just typecheck`      | Run TypeScript type checking           |
| `just link-local`     | Symlink to global OpenCode plugins     |
| `just link-project`   | Symlink to current project's plugins   |
| `just unlink-local`   | Remove global plugin symlink           |
| `just unlink-project` | Remove project plugin symlink          |
| `just clean`          | Clean build artifacts                  |
| `just rebuild`        | Full rebuild from clean state          |
| `just prepublish`     | Prepare for publishing (build + types) |

Alternatively, you can use `bun run <script>` with the npm scripts in `package.json`.

### Local Development Workflow

1. Clone and install dependencies:

   ```bash
   git clone https://github.com/whomwah/opencode-ralph-wiggum.git
   cd opencode-ralph-wiggum
   just install
   ```

2. Link the plugin to OpenCode:

   ```bash
   just link-local
   ```

   This creates a symlink at `~/.config/opencode/plugin/ralph-wiggum.ts` pointing to `src/index.ts`.

3. (Re)start OpenCode - it will discover and load the plugin from the symlink

4. Make changes to `src/index.ts`

5. Restart OpenCode to pick up changes (plugins are loaded once at startup)

6. Run `just typecheck` to verify types before committing

### Publishing to npm

```bash
# Ensure you're logged in to npm
npm login

# Build and publish
just prepublish
npm publish
```

Once published, users can install via their `opencode.json`:

```json
{
  "plugin": ["opencode-ralph-wiggum"]
}
```

## Usage

There are two ways to use Ralph: **direct prompts** for simple tasks, or **plan-based workflow** for structured projects.

### Quick Start

1. **Create a plan** - Describe what you want to build:

   ```
   You: "Use rw-plan with name 'my-api' and description 'Build a REST API for todos'"
   ```

   This creates `.opencode/plans/my-api.md` with a template.

2. **Edit the plan** - Add your tasks with checkbox format:

   ```markdown
   - [ ] **Setup project** - Initialize with TypeScript and tests
   - [ ] **Add endpoints** - CRUD operations for todos
   - [ ] **Add auth** - JWT-based authentication
   ```

3. **Start the loop** - Ralph works through each task:
   ```
   You: "rw-start"
   ```

That's it! Ralph iterates through tasks, marking each complete and committing changes.

### Creating a Plan

Use OpenCode's plan mode to create your PLAN.md:

```
# Switch to plan mode (Ctrl+K in OpenCode)
You: "I want to build a CLI tool that converts markdown to HTML"
AI: [Helps you think through the design]

You: "Create a PLAN.md with these tasks"
AI: [Creates structured plan file]
```

Or use the `rw-plan` tool:

```
You: "Use rw-plan to create a plan for building a REST API"
```

The `rw-plan` workflow:

1. Call with `action='create'` and a name/description to get the target file path
2. Generate an appropriate plan and show it to the user
3. User may request changes - refine the plan in conversation
4. When approved, call with `action='save'` and `content=<the plan>` to write to disk

### Example PLAN.md

```markdown
# Markdown CLI Tool

## Overview

Build a CLI tool that converts markdown files to styled HTML.
Target: Node.js, TypeScript, published to npm.

## Tasks

- [ ] **Project Setup**
      Initialize TypeScript project with proper configuration.
      Add eslint, prettier, and vitest.

- [ ] **Core Parser**
      Implement markdown parsing using marked library.
      Support GFM extensions.

- [ ] **CLI Interface**
      Add commander.js for argument parsing.
      Support: input file, output file, --watch mode.

- [ ] **Styling**
      Add default CSS styles for HTML output.
      Support custom style injection via --style flag.

- [ ] **Tests**
      Write unit tests for parser and CLI.
      Aim for >80% coverage.

- [ ] **Documentation**
      Write README with usage examples.
      Add --help output.
```

### Starting a Ralph Loop

**From a plan (simplest):**

```
You: "Start ralph loop"
# or
You: "Use rw-start"
```

Ralph reads PLAN.md, works through each task, and stops when all tasks are marked complete.

**Direct prompt (for simple tasks):**

```
You: "Use rw-loop with prompt 'Build a REST API for todos' and completionPromise 'DONE'"
```

### Single Task Execution

For more control, execute tasks one at a time:

```
# List available tasks
You: "Use rw-tasks"

# Execute task #2
You: "Use rw-task 2"

# Task is automatically marked complete when finished
```

This is useful when you want to:

- Review work between tasks
- Make manual adjustments before committing
- Skip certain tasks
- Debug a specific task

**Key difference from loop mode**: Single task execution does NOT create git commits automatically. You review the changes and commit manually when satisfied.

### Modes Comparison

| Behavior            | `rw-start` (plan loop)          | `rw-task` (single task) | `rw-loop` (direct loop)   |
| ------------------- | ------------------------------- | ----------------------- | ------------------------- |
| Input               | PLAN.md file                    | PLAN.md file            | Direct prompt             |
| Auto-complete task  | Yes                             | Yes                     | N/A (no tasks)            |
| Git commit per task | Yes                             | No                      | No                        |
| Continues to next   | Yes                             | No                      | Same prompt each time     |
| Stops when          | All tasks complete              | Task complete           | Completion promise found  |
| Best for            | Walk away, review commits later | Step through carefully  | Iterative problem-solving |

**`rw-start`**: Best for structured projects. Creates git commits so you can review each task's changes.

**`rw-task`**: Best for careful, controlled execution. No commits - you review and commit manually.

**`rw-loop`**: Best for hammering at one goal ("make tests pass", "fix the build") until it works.

### Available Tools

| Tool                  | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `rw-start`            | Start loop from PLAN.md (auto-commits per task)        |
| `rw-plan`             | Create or view a PLAN.md file                          |
| `rw-tasks`            | List all tasks from the plan                           |
| `rw-task`             | Execute a single task (auto-completes, no commit)      |
| `rw-complete`         | Manually mark a task complete (rarely needed now)      |
| `rw-loop`             | Start loop with direct prompt (advanced, no plan file) |
| `rw-cancel`           | Cancel the active Ralph loop                           |
| `rw-status`           | Check the status of the current loop                   |
| `rw-check-completion` | Manually check if text contains the completion promise |

### Tool Parameters

#### rw-start

| Parameter       | Type   | Required | Description                                       |
| --------------- | ------ | -------- | ------------------------------------------------- |
| `file`          | string | No       | Plan file path (default: .opencode/plans/PLAN.md) |
| `maxIterations` | number | No       | Max iterations (default: 0 = unlimited)           |

#### rw-plan

| Parameter     | Type   | Required | Description                                                        |
| ------------- | ------ | -------- | ------------------------------------------------------------------ |
| `action`      | string | No       | 'create', 'view', or 'save' (default: create)                      |
| `name`        | string | No       | Plan name - used to generate filename (e.g., 'My API' → my-api.md) |
| `description` | string | No       | Project description (also used for filename if no name)            |
| `file`        | string | No       | Explicit file path (overrides auto-generated name)                 |
| `content`     | string | No       | Plan content to save (required when action='save')                 |

Filename generation priority:

1. Explicit `file` parameter if provided
2. Slugified `name` parameter
3. Slugified `description` parameter
4. Falls back to "plan.md"

All plans are stored in `.opencode/plans/` by default.

#### rw-task

| Parameter | Type   | Required | Description                                       |
| --------- | ------ | -------- | ------------------------------------------------- |
| `task`    | string | Yes      | Task number (1, 2, 3...) or name                  |
| `file`    | string | No       | Plan file path (default: .opencode/plans/PLAN.md) |

#### rw-loop

Direct loop mode - keeps feeding the same prompt until completion or max iterations. Ideal for iterative problem-solving like "make tests pass" or "fix the build".

| Parameter           | Type   | Required | Description                                                     |
| ------------------- | ------ | -------- | --------------------------------------------------------------- |
| `prompt`            | string | Yes      | The task prompt to execute repeatedly                           |
| `maxIterations`     | number | No       | Maximum iterations before stopping (default: 2, 0 = unlimited)  |
| `completionPromise` | string | No       | Phrase that signals completion when wrapped in `<promise>` tags |

## Plan File Format

The PLAN.md file uses simple markdown:

```markdown
# Project Title

## Overview

Project context and goals (helps AI make better decisions).

## Tasks

- [ ] **Task Title**
      Description and details indented below.

- [ ] **Another Task**
      More details here.

- [x] **Completed Task**
      Already done tasks use [x].
```

### Key Elements

1. **Title**: First `# Heading` becomes the plan title
2. **Overview**: Context section helps AI understand the project
3. **Tasks**: Use `- [ ]` checkbox format, bold titles recommended
4. **Task Descriptions**: Indent with 2+ spaces under the task line

**Note**: The `completion_promise` comment is optional and used with the legacy `rw-loop` tool. For plan-based workflows (`rw-start`, `rw-task`), completion is determined by task checkboxes.

## Prompt Writing Best Practices

These tips are especially useful for the direct `rw-loop` mode where you're iterating on a single goal.

### 1. Clear Completion Criteria

**Bad:**

```
Build a todo API and make it good.
```

**Good:**

```
Build a REST API for todos.

When complete:
- All CRUD endpoints working
- Input validation in place
- Tests passing (coverage > 80%)
- README with API docs
```

### 2. Incremental Goals

**Bad:**

```
Create a complete e-commerce platform.
```

**Good:**

```
Phase 1: User authentication (JWT, tests)
Phase 2: Product catalog (list/search, tests)
Phase 3: Shopping cart (add/remove, tests)
```

### 3. Self-Correction

**Bad:**

```
Write code for feature X.
```

**Good:**

```
Implement feature X following TDD:
1. Write failing tests
2. Implement feature
3. Run tests
4. If any fail, debug and fix
5. Refactor if needed
6. Repeat until all green
```

### 4. Safety Limits

Always use `maxIterations` as a safety net to prevent runaway loops:

```
rw-loop with maxIterations: 20
```

When maxIterations is reached, the loop **stops completely** - it does not continue to the next task. This is intentional: if a task isn't completing within the expected iterations, human review is needed.

## How It Works

### Plan-Based Mode (rw-start, rw-task)

1. **Loop Activation**: When you call `rw-start`, the plugin reads PLAN.md and creates a state file at `.opencode/ralph-loop.local.json`

2. **Task Execution**: The plugin generates a prompt for the first pending task and sends it to the AI

3. **Session Monitoring**: The plugin listens for the `session.idle` event which fires when the AI finishes its response

4. **Task Completion**: When idle, the plugin marks the current task as `[x]` in PLAN.md and (in loop mode) creates a git commit

5. **Loop Continuation**: The plugin finds the next pending task and sends a new prompt. If no pending tasks remain, the loop ends.

6. **Safety Stop**: If `maxIterations` is reached before all tasks complete, the loop halts entirely for human review

### Direct Loop Mode (rw-loop)

1. **Loop Activation**: When you call `rw-loop`, the plugin stores your prompt and creates a state file

2. **Same Prompt Each Time**: Unlike plan-based mode, the exact same prompt is fed back each iteration

3. **Completion Detection**: The plugin checks the AI's output for `<promise>YOUR_TEXT</promise>` tags matching your completion promise

4. **Iterative Improvement**: The AI sees files modified by previous attempts, allowing it to build on its own work

5. **Stops When**: The completion promise is detected OR maxIterations is reached

## Philosophy

Ralph embodies several key principles:

### 1. Iteration > Perfection

Don't aim for perfect on first try. Let the loop refine the work.

### 2. Failures Are Data

"Deterministically bad" means failures are predictable and informative. Use them to tune prompts.

### 3. Operator Skill Matters

Success depends on writing good prompts, not just having a good model.

### 4. Persistence Wins

Keep trying until success. The loop handles retry logic automatically.

## When to Use Ralph

### Plan-based mode (`rw-start`) is good for:

- Multi-step projects with distinct phases
- Greenfield development where you want git commits per task
- Projects where you want to review progress task-by-task

### Direct loop mode (`rw-loop`) is good for:

- "Make the tests pass" - iterate until green
- "Fix the build errors" - hammer until it compiles
- Bug hunting - keep trying fixes until resolved
- Any goal with clear, verifiable success criteria

### Not good for:

- Tasks requiring human judgment or design decisions
- One-shot operations that don't benefit from iteration
- Tasks with unclear success criteria
- Production debugging (use targeted debugging instead)

## Differences from Claude Code Plugin

This OpenCode port has some differences from the original Claude Code plugin:

| Feature           | Claude Code                 | OpenCode                 |
| ----------------- | --------------------------- | ------------------------ |
| Loop mechanism    | Stop hook (shell script)    | `session.idle` event     |
| Commands          | Slash commands (`/rw-loop`) | Custom tools             |
| State storage     | Markdown frontmatter        | JSON file                |
| Loop continuation | Blocks exit + feeds prompt  | Sends new prompt via SDK |

## Learn More

- Original technique: https://ghuntley.com/ralph/
- Ralph Orchestrator: https://github.com/mikeyobrien/ralph-orchestrator
- OpenCode Plugins: https://opencode.ai/docs/plugins/

## Credits

- Original Ralph Wiggum technique by [Geoffrey Huntley](https://ghuntley.com)
- Claude Code plugin by Daisy Hollman (Anthropic)
- OpenCode port by the community

## License

MIT
