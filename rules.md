# Operational Rules

## Mandatory MCP Tool Use

1. **Always Use MCP for Answering Questions**:
   - For any question regarding system operations, security, compliance standards, CLI commands, configuration, architecture, or diagnostics, **always query the registered MCP server (`ibm-docs-powersc`)** before formulating the response.
   - Use the appropriate MCP tool:
     - `search_powersc_docs`: For general search across topics and features.
     - `powersc_troubleshoot`: For diagnostics, root causes, log paths, and issue remediation.
     - `powersc_command_reference`: For CLI command syntax, flags, and usage examples (`pscmd`, `powerscgis`, `powersc-agent`, `pbm`, `rtc`, `pmfa`).
     - `powersc_compliance_profile`: For security profiles (`PCI_DSS`, `CIS`, `DoD_STIG`, `NIST_SP_800_53`, `HIPAA`, `SAP`).
     - `get_powersc_toc`: For browsing section structures across PowerSC versions (`2.2.0`, `2.1.0`, `2.0.0`).
     - `fetch_ibm_doc_page`: For live retrieval and markdown parsing of arbitrary IBM Documentation URLs.

2. **Mandatory Specific Topic Verification Link**:
   - Every answer must include the direct, topic-specific IBM Documentation link (`docUrl` with specific `?topic=...` slug) returned by the MCP tool rather than a generic root URL, ensuring the user is routed directly to the exact article on the web.

3. **Grounding**:
   - Do not speculate or generate unverified claims. Base all technical solutions directly on the data retrieved from the MCP server.
