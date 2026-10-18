# Project Coding Rules (Agent Mode - Non-Obvious Only)

- **Mandatory MCP Query Rule**: Follow `rules.md` — query MCP tools first for every technical question and include official IBM doc links.
- **Stdio Stdout Protection**: `process.stdout` is exclusively reserved for Model Context Protocol JSON-RPC frames. Never use `console.log()` anywhere in server logic; use `console.error()`.
- **TypeScript Resolution**: Target is `ES2022` with `Node16` resolution. All relative module imports require explicit `.js` extensions.
- **Custom Types**: Turndown types are in `src/turndown.d.ts`. Do not attempt to add `@types/turndown` to `package.json`.
- **Build Path Invocation**: Because the root workspace folder contains an ampersand (`AI & web`), execute `tsc` directly via `node "node_modules/typescript/bin/tsc"` inside `ibm-docs-mcp-server/`.
- **Tool Output Constraint**: Every PowerSC troubleshooting item and compliance profile response MUST include a valid `docUrl` property pointing to official IBM documentation.
