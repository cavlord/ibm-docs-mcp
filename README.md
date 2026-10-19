<div align="center">

# 🛡️ IBM PowerSC Documentation MCP Server

**Ask IBM Bob about PowerSC. Get answers with official IBM documentation links.**

![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-3b82d4)
![Node.js](https://img.shields.io/badge/Node.js-required-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-ESM-3178C6?logo=typescript&logoColor=white)
![IBM Bob](https://img.shields.io/badge/Made%20for-IBM%20Bob-7c5cd8)

</div>

---

## 📖 About

An MCP server that lets **IBM Bob** search and read **IBM PowerSC** (Power Security and Compliance) documentation. It covers compliance profiles, Real-Time Compliance (RTC), File Integrity Monitoring (FIM), Multi-Factor Authentication (MFA), CLI commands, and troubleshooting. Every answer includes a link to the official IBM documentation so you can verify it.

---

## 🚀 Quick Start

> **Requirement:** [Node.js](https://nodejs.org) installed.

| Step | Action |
| :---: | :--- |
| **1** | **Download** this repo: green **Code → Download ZIP** button (then extract), or `git clone https://github.com/cavlord/ibm-docs-mcp.git` |
| **2** | **Open IBM Bob → Open Folder** → select the downloaded folder |
| **3** | **Paste this prompt** into the Bob chat (below) |

```text
Set up this MCP server: run npm install and build in the ibm-docs-mcp-server folder, then configure .bob/mcp.json with the absolute path of this folder.
```

✅ When Bob finishes, the `ibm-docs-powersc` MCP is ready to use. If it doesn't show up, reload Bob.

---

## 💬 Example Questions

| Ask Bob | Tool used |
| :--- | :--- |
| *"How do I configure File Integrity Monitoring in PowerSC 2.2.0?"* | `search_powersc_docs` |
| *"Show me the syntax of `pscxpert`."* | `powersc_command_reference` |
| *"What does the PCI DSS compliance profile check?"* | `powersc_compliance_profile` |
| *"My PowerSC agent can't connect, SSL certificate error. How do I troubleshoot it?"* | `powersc_troubleshoot` |

---

## 🧰 Available Tools

| Tool | Purpose |
| :--- | :--- |
| 🔎 `search_powersc_docs` | Search PowerSC topics, commands, compliance profiles, and errors |
| 📚 `get_powersc_toc` | Browse the PowerSC documentation table of contents (2.2.0, 2.1.0, 2.0.0) |
| 📄 `fetch_ibm_doc_page` | Fetch an IBM Documentation page and convert it to Markdown |
| ⌨️ `powersc_command_reference` | Syntax and examples for commands (`pscxpert`, `mkrtc`, `pmconf`, etc.) |
| ✅ `powersc_compliance_profile` | Rules for PCI DSS, CIS, DoD STIG, GDPR, SAP, and other profiles |
| 🩺 `powersc_troubleshoot` | Fixes for agent, SSL, AHAFS, FIM, and MFA issues, plus log locations |

---

## 🔧 Manual Setup (optional)

<details>
<summary>Prefer not to ask Bob? Click to expand.</summary>

<br>

**1. Build the server**

```powershell
cd ibm-docs-mcp-server
npm install
npm run build
```

**2. Register it in `.bob/mcp.json`** (use the **absolute path** to `build/index.js`)

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

**3. Reload Bob.**

</details>

---

<div align="center">
<sub>Made with IBM Bob</sub>
</div>
