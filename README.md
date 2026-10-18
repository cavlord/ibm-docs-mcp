# IBM PowerSC Documentation MCP Server

A specialized Model Context Protocol (MCP) server designed for **IBM Documentation (`ibm.com/docs`)** and **IBM PowerSC (Power Security and Compliance)** running on IBM Power systems (AIX, Linux on Power, IBM i).

This server enables AI assistants (such as IBM Bob IDE) to search, browse, fetch, and troubleshoot PowerSC security compliance, Real-Time Compliance (RTC), File Integrity Monitoring (FIM), Multi-Factor Authentication (MFA), commands (`pscmd`, `powerscgis`, `powersc-agent`, `pbm`), and system hardening profiles.

---

## 🛠️ Features & Exposed MCP Tools

| Tool Name | Description |
| :--- | :--- |
| `search_powersc_docs` | Search PowerSC documentation topics, commands, compliance profiles, and errors. Includes verification doc links. |
| `get_powersc_toc` | Browse Table of Contents and topic structure for PowerSC versions (`2.2.0`, `2.1.0`, `2.0.0`). |
| `fetch_ibm_doc_page` | Fetch live IBM Documentation HTML pages and convert them into clean Markdown. |
| `powersc_command_reference` | CLI syntax, arguments, flags, and examples for `pscmd`, `powerscgis`, `powersc-agent`, `pbm`, `rtc`, and `pmfa`. |
| `powersc_compliance_profile` | Compliance rules and check definitions for `PCI_DSS`, `CIS`, `DoD_STIG`, `NIST_SP_800_53`, `HIPAA`, and `SAP`. |
| `powersc_troubleshoot` | Diagnostic resolutions for agent connection issues, SSL/keystore certificates, AHAFS errors, and log locations. **Always includes direct IBM Documentation URLs for user verification.** |

---

## 🚀 Installation & Build

Requires Node.js 18+ and npm.

```powershell
git clone https://github.com/cavlord/ibm-docs-mcp.git
cd ibm-docs-mcp/ibm-docs-mcp-server
npm install
npm run build
```

`npm run build` compiles `src/` to `build/index.js` (it runs `node node_modules/typescript/bin/tsc`, which also works when the parent folder path contains spaces or `&`).

---

## ⚙️ Configuration in Bob IDE (`.bob/mcp.json`)

Create or edit `.bob/mcp.json` in your workspace root and add the server. Use the **full absolute path** to `build/index.js` (Bob cannot resolve relative paths on Windows) and escape backslashes.

```json
{
  "mcpServers": {
    "ibm-docs-powersc": {
      "command": "node",
      "args": [
        "C:\\path\\to\\ibm-docs-mcp\\ibm-docs-mcp-server\\build\\index.js"
      ]
    }
  }
}
```

Linux/macOS example: `"/home/user/ibm-docs-mcp/ibm-docs-mcp-server/build/index.js"`.

After saving, reload Bob (or toggle the server in the MCP settings). The server `ibm-docs-powersc` should appear with 6 tools.

---

## ▶️ Running & Using the MCP Server

### Run manually (stdio)

```powershell
cd ibm-docs-mcp-server
npm start          # same as: node build/index.js
```

The server speaks JSON-RPC over stdio, so it will appear to "hang" waiting for input. This is expected. Press `Ctrl+C` to stop.

### Verify it responds

```powershell
node -e "const cp = require('child_process').spawn('node', ['build/index.js']); cp.stdout.on('data', d => console.log('OUT:', d.toString())); cp.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'test',version:'1.0'}}}) + '\n'); setTimeout(() => process.exit(0), 1500);"
```

A JSON response containing `serverInfo` means the server works.

### Use from Bob

Once configured, ask Bob PowerSC questions in chat and it will call the tools automatically, for example:

- "How do I configure File Integrity Monitoring in PowerSC 2.2.0?"
- "Show the syntax of `pscxpert`."
- "What does the PCI DSS compliance profile check?"
- "My PowerSC agent can't connect to the server, SSL certificate error. How to troubleshoot?"

Responses include official `https://www.ibm.com/docs/en/powersc-standard/...` links for verification.

### Development

```powershell
npm run build      # recompile after editing src/
```

Rebuild and reload the MCP server in Bob after every code change.

---

## 📖 Supported Standards & Compliance Profiles

- **PCI DSS**: Payment Card Industry Data Security Standard
- **CIS Benchmarks**: Center for Internet Security hardening baseline for AIX and Linux on Power
- **DoD STIG**: US Department of Defense Security Technical Implementation Guide
- **NIST SP 800-53**: National Institute of Standards and Technology security controls
- **HIPAA**: Health Insurance Portability and Accountability Act
- **SAP**: Enterprise SAP HANA and NetWeaver hardening on PowerVM
