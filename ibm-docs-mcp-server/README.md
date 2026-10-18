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

```powershell
cd ibm-docs-mcp-server
npm install
npm run build
```

---

## ⚙️ Configuration in Bob IDE (`.bob/mcp.json`)

```json
{
  "mcpServers": {
    "ibm-docs-powersc": {
      "command": "node",
      "args": [
        "c:\\Users\\FAHMIRAHMADI\\Documents\\Learning\\AI & web\\IBM I\\ibm-docs-mcp-server\\build\\index.js"
      ]
    }
  }
}
```

---

## 📖 Supported Standards & Compliance Profiles

- **PCI DSS**: Payment Card Industry Data Security Standard
- **CIS Benchmarks**: Center for Internet Security hardening baseline for AIX and Linux on Power
- **DoD STIG**: US Department of Defense Security Technical Implementation Guide
- **NIST SP 800-53**: National Institute of Standards and Technology security controls
- **HIPAA**: Health Insurance Portability and Accountability Act
- **SAP**: Enterprise SAP HANA and NetWeaver hardening on PowerVM
