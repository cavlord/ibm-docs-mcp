# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands (Must run in `ibm-docs-mcp-server/`)
- **Build**: `cd ibm-docs-mcp-server && node "node_modules/typescript/bin/tsc"` (Do not use bare global `tsc`; parent folder contains spaces and ampersands `&`).
- **Start / Run**: `node build/index.js`
- **Stdio Test / Verification**:
  ```powershell
  node -e "const cp = require('child_process').spawn('node', ['ibm-docs-mcp-server/build/index.js']); cp.stdout.on('data', d => console.log('OUT:', d.toString())); cp.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'test',version:'1.0'}}}) + '\n'); setTimeout(() => process.exit(0), 1500);"
  ```

## Critical Gotchas & Non-Obvious Patterns
- **MCP-First Answering Rule**: See `rules.md`. Always query the MCP server tools first for questions and always include direct IBM documentation verification links.
- **Protocol Safety**: NEVER write diagnostic logs to `console.log()` inside `src/index.ts` — it breaks the JSON-RPC stdio stream. Always use `console.error()`.
- **Absolute Paths in `.bob/mcp.json`**: Bob's process runner fails to resolve relative paths on Windows. Always use the full absolute path (`c:\\Users\\...\\ibm-docs-mcp-server\\build\\index.js`) in `.bob/mcp.json`.
- **ESM Relative Imports**: `tsconfig.json` uses `Node16` resolution. All relative imports must end with `.js` (e.g. `import ... from "./index.js"`).
- **Type Definitions**: Do not install `@types/turndown` (incompatible/missing version on npm registry); maintain manual types in `src/turndown.d.ts`.
- **Verification Links**: PowerSC MCP responses must always attach official `https://www.ibm.com/docs/en/powersc-standard/...` URLs for documentation verification.
