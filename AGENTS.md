<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:agent-instructions-for-agents -->
#These six phases form one continuous project. Read and update the shared audit, data inventory, architecture, and progress documents throughout the process. Do not treat the prompts as independent tasks.

The most important requirement is to reuse my existing Mumbai flood work, inspect its real datasets and scripts, and integrate it properly. Do not rebuild what already works, and do not represent Mumbai-only data as availale for Pune or Nagpur.

Work autonomously on tasks that can be completed safely. If an API key, dataset, permission, or important decision is missing, record it in the pending-input checklist, use a transparent fallback if appropriate, and continue with independent tasks.

Keep all work local and undeployed. Preserve the original Urban Link repository and database. Only after implementation, regression testing, screenshot review, and secret scanning should you prepare the new "sentinel-city-intelligence" repository. Do not overwrite the original repository, expose credentials, or publish sensitive data.

If a phase is incomplete, report the exact unfinished tasks and continue where possible. At the end, leave a clear progress report, actual screenshots, test results, repository status, and the exact inputs I need to provide tomorrow.
<!-- END:agent-instructions-for-agents -->
