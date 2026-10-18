# Project Architecture & Constraints Rules (Plan Mode - Non-Obvious Only)

- **MCP Stdio Server Architecture**: The server runs as a child process communicating over stdin/stdout. Any modification must preserve JSON-RPC message framing.
- **Path Resolution in Bob Registry**: Registration in `.bob/mcp.json` requires an absolute file path due to Windows subshell execution behavior in Bob IDE.
- **Dual-Layer Search Architecture**: PowerSC tools use a hybrid model: curated in-memory knowledge base with live Akamai-compatible scraping (`fetchIbmDocsHtml` via Cheerio/Turndown) fallback.
