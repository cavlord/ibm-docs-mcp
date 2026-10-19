# IBM PowerSC Documentation MCP Server

An MCP server that lets IBM Bob search and read **IBM PowerSC** (Power Security and Compliance) documentation. Every answer includes links to the official IBM documentation.

## Quick Start (3 steps)

**Requirement:** [Node.js](https://nodejs.org) installed.

1. **Download** this repo (green **Code → Download ZIP** button, then extract) or run `git clone https://github.com/cavlord/ibm-docs-mcp.git`.
2. **Open IBM Bob → Open Folder** → select the downloaded folder.
3. **Paste this prompt into the Bob chat:**

   ```
   Set up this MCP server: run npm install and build in the ibm-docs-mcp-server folder, then configure .bob/mcp.json with the absolute path of this folder.
   ```

That's it. When Bob finishes, the `ibm-docs-powersc` MCP is ready to use. If it doesn't show up, reload Bob.

## Example Questions

- "How do I configure File Integrity Monitoring in PowerSC 2.2.0?"
- "Show me the syntax of `pscxpert`."
- "What does the PCI DSS compliance profile check?"
- "My PowerSC agent can't connect, SSL certificate error. How do I troubleshoot it?"

## Available Tools

| Tool | Purpose |
| :--- | :--- |
| `search_powersc_docs` | Search PowerSC topics, commands, compliance profiles, and errors |
| `get_powersc_toc` | Browse the PowerSC documentation table of contents (2.2.0, 2.1.0, 2.0.0) |
| `fetch_ibm_doc_page` | Fetch an IBM Documentation page and convert it to Markdown |
| `powersc_command_reference` | Syntax and examples for commands (`pscxpert`, `mkrtc`, `pmconf`, etc.) |
| `powersc_compliance_profile` | Rules for PCI DSS, CIS, DoD STIG, GDPR, SAP, and other profiles |
| `powersc_troubleshoot` | Fixes for agent, SSL, AHAFS, FIM, and MFA issues, plus log locations |

## Manual Setup (optional)

If you prefer not to ask Bob, run it yourself:

```powershell
cd ibm-docs-mcp-server
npm install
npm run build
```

Then add this to `.bob/mcp.json` (use the **absolute path** to `build/index.js`):

```json
{
  "mcpServers": {
    "ibm-docs-powersc": {
      "command": "node",
      "args": ["C:\\path\\to\\ibm-docs-mcp\\ibm-docs-mcp-server\\build\\index.js"]
    }
  }
}
```
