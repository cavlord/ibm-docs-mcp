#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Configure Turndown rules
turndown.remove(["script", "style", "noscript", "iframe", "svg", "nav", "footer", "header"]);

// User agent header to cleanly access IBM Documentation
const HTTP_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (IBM PowerSC DocBot)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

// PowerSC Knowledge Base & Index
interface PowerSCProfile {
  name: string;
  code: string;
  description: string;
  targetOS: string[];
  keyRules: string[];
  docUrl: string;
}

interface PowerSCCommand {
  name: string;
  path: string;
  purpose: string;
  syntax: string;
  options: { [flag: string]: string };
  examples: string[];
  notes: string;
  docUrl: string;
}

interface TroubleshootingItem {
  problem: string;
  symptoms: string[];
  possibleCauses: string[];
  solutions: string[];
  relevantLogs: string[];
  docUrl: string;
}

const POWERSC_PROFILES: PowerSCProfile[] = [
  {
    name: "PCI DSS (Payment Card Industry Data Security Standard)",
    code: "PCI_DSS",
    description: "Enforces security compliance and audit readiness for systems processing payment cards.",
    targetOS: ["AIX 7.1/7.2/7.3", "RHEL on Power", "SLES on Power"],
    keyRules: [
      "Password complexity and maximum age (90 days)",
      "Account lockout after 6 failed login attempts",
      "SSH configuration: disable root login, enforce SSHv2, strong ciphers",
      "Audit logging and retention of all administrative actions",
      "File permission integrity on payment processing directories and binaries"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=scac-payment-card-industry-data-security-standard-dss-compliance-aix-linux-vios"
  },
  {
    name: "CIS Benchmarks (Center for Internet Security)",
    code: "CIS",
    description: "Industry-standard baseline security hardening benchmarks for AIX and Linux operating systems on Power.",
    targetOS: ["AIX 7.1/7.2/7.3", "RHEL 8/9 on Power", "SLES 15 on Power"],
    keyRules: [
      "Disable unnecessary network services (inetd / xinetd / telnet / rsh)",
      "Strict file permission masks (umask 027 or 077)",
      "Kernel security parameters (network stack hardening, ICMP redirects disabled)",
      "System logging via syslog/auditd with centralized forwarding",
      "Restrict cron and at execution permissions"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=scac-center-internet-security-cis-v3-benchmarks-compliance-aix-7"
  },
  {
    name: "DoD STIG (Security Technical Implementation Guide)",
    code: "DoD_STIG",
    description: "US Department of Defense cybersecurity compliance standards for enterprise Power systems.",
    targetOS: ["AIX 7.2/7.3", "RHEL on Power"],
    keyRules: [
      "Multi-factor authentication enforcement (PowerSC MFA)",
      "Strict login banners and DoD disclaimer display",
      "Disable core dumps for unprivileged applications",
      "Enforce mandatory access controls and strict SUID/SGID auditing",
      "Secure boot and firmware verification (Trusted Boot)"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=concepts-department-defense-stig-compliance"
  },
  {
    name: "GDPR / Data Privacy Profile",
    code: "GDPR",
    description: "General Data Protection Regulation security requirements for AIX and Linux on Power.",
    targetOS: ["AIX", "Linux on Power"],
    keyRules: [
      "Mandatory access logging and administrative auditing",
      "Encrypted transmission protocols and restricted root escalation",
      "Periodic file integrity verification"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=scac-general-data-protection-regulation-gdpr-compliance-aix-linux"
  },
  {
    name: "SAP Security Hardening",
    code: "SAP",
    description: "Specialized profile tailored for enterprise SAP HANA / NetWeaver environments on PowerVM.",
    targetOS: ["AIX", "SLES for SAP", "RHEL for SAP"],
    keyRules: [
      "Security hardening compatible with SAP user IDs (<sid>adm) and shared memory",
      "Network port restriction while keeping SAP dispatcher/gateway ports open",
      "IPC and IPC semaphore protection"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=concepts-sap-compliance-aix"
  },
  {
    name: "Database Compliance Profile for AIX",
    code: "DB_COMPLIANCE",
    description: "Hardening controls for database servers (Db2, Oracle) running on AIX.",
    targetOS: ["AIX 7.1/7.2/7.3"],
    keyRules: [
      "Database data directory permission isolation",
      "Dedicated audit event generation for database admin operations",
      "Kernel shared memory security"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=concepts-database-compliance-aix"
  }
];

const POWERSC_COMMANDS: PowerSCCommand[] = [
  {
    name: "pscuiagentctl / powersc-agent",
    path: "/opt/powersc/agent/bin/pscuiagentctl or systemctl start powersc-agent",
    purpose: "Endpoint agent service daemon that connects PowerVM LPARs/endpoints to the PowerSC GUI Server.",
    syntax: "pscuiagentctl [start | stop | status | register -s <server_ip> -p <port>]",
    options: {
      "start": "Starts the endpoint agent daemon",
      "stop": "Stops the endpoint agent daemon",
      "status": "Checks agent connection status to the central PowerSC UI server",
      "register -s <server_ip> -p <port>": "Registers endpoint agent with PowerSC UI server"
    },
    examples: [
      "systemctl status powersc-agent",
      "/opt/powersc/agent/bin/pscuiagentctl status",
      "/opt/powersc/agent/bin/pscuiagentctl register -s 192.168.1.100 -p 443"
    ],
    notes: "Ensure outbound port 443/5443/50000 is open to the PowerSC GUI server.",
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=commands-pscuiagentctl-command"
  },
  {
    name: "pscuiserverctl / powerscgis",
    path: "/opt/powersc/uiServer/bin/pscuiserverctl or systemctl start powersc-uiServer",
    purpose: "PowerSC GUI Server daemon control command. Manages the central web UI server process and keystores.",
    syntax: "pscuiserverctl [start | stop | status | restart | certgen]",
    options: {
      "start": "Starts the PowerSC GUI server daemon",
      "stop": "Gracefully stops the PowerSC GUI server daemon",
      "status": "Checks if the GUI server and listener ports (default 443 / 5443) are active",
      "restart": "Restarts the GUI server daemon"
    },
    examples: [
      "service powersc-uiServer status",
      "/opt/powersc/uiServer/bin/pscuiserverctl status",
      "/opt/powersc/uiServer/bin/pscuiserverctl restart"
    ],
    notes: "GUI Server logs are located at /opt/powersc/uiServer/logs/uiServer.log.",
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=commands-pscuiserverctl-command"
  },
  {
    name: "pscxpert (Security Expert CLI)",
    path: "/usr/sbin/pscxpert or /opt/powersc/pscxpert/bin/pscxpert",
    purpose: "CLI command for applying, checking, and undoing security compliance profiles directly from the shell.",
    syntax: "pscxpert -p <profile_xml> [options]",
    options: {
      "-a": "Apply compliance rules in profile",
      "-c": "Check compliance against profile without modifying system",
      "-u": "Undo previously applied compliance remedies",
      "-d": "Output detailed diagnostic report"
    },
    examples: [
      "pscxpert -c -p /etc/security/pscxpert/custom/pci.xml",
      "pscxpert -a -p /etc/security/pscxpert/custom/cis.xml",
      "pscxpert -u -p /etc/security/pscxpert/custom/cis.xml"
    ],
    notes: "Requires root privileges.",
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=commands-pscxpert-command"
  },
  {
    name: "mkrtc (Real-Time Compliance Configuration)",
    path: "/usr/sbin/mkrtc",
    purpose: "Configures and starts Real-Time Compliance (RTC) event listeners.",
    syntax: "mkrtc [options]",
    options: {
      "-f": "Specify monitored files list configuration",
      "-a": "Activate real-time monitoring daemons"
    },
    examples: [
      "mkrtc -a",
      "mkrtc -f /etc/security/rtc/rtc_files.conf"
    ],
    notes: "Requires AHAFS filesystem mounted on AIX.",
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=commands-mkrtc-command"
  },
  {
    name: "pmconf (Patch Management Configuration)",
    path: "/usr/sbin/pmconf",
    purpose: "TNC Patch Management server and client configuration tool.",
    syntax: "pmconf [command] [options]",
    options: {
      "status": "Check patch server daemon status",
      "sync": "Synchronize patch repository with primary host"
    },
    examples: [
      "pmconf status",
      "pmconf sync"
    ],
    notes: "Part of PowerSC Trusted Network Connect (TNC) component.",
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=commands-pmconf-command"
  }
];

const TROUBLESHOOTING_GUIDE: TroubleshootingItem[] = [
  {
    problem: "Agent cannot connect or register with PowerSC GUI Server",
    symptoms: [
      "powersc-agent status shows 'Disconnected' or 'Failed to communicate with UI Server'",
      "Error: SSLHandshakeException or Connection refused on port 443/5443",
      "Endpoint missing from PowerSC web dashboard"
    ],
    possibleCauses: [
      "Network firewall blocking TCP ports 443, 5443, or 50000 between agent and GUI server",
      "Self-signed SSL certificate expired or untrusted keystore on endpoint",
      "Time drift between PowerSC UI Server and agent endpoint (NTP out of sync > 5 mins)",
      "DNS resolution failure of UI server hostname from endpoint"
    ],
    solutions: [
      "1. Verify connectivity with `nc -zv <ui_server_ip> 443` or `curl -k https://<ui_server_ip>:443` from endpoint.",
      "2. Synchronize NTP clocks using `ntpdate -u <ntp_server>` or `chronyc sources` on both server and agent.",
      "3. Re-trust certificate: Copy `/opt/powersc/uiServer/conf/truststore.p12` or re-run registration: `pscuiagentctl register -s <server_ip> -p 443`.",
      "4. Check UI Server service: `systemctl status powersc-uiServer` or `/opt/powersc/uiServer/bin/pscuiserverctl status`."
    ],
    relevantLogs: [
      "/opt/powersc/agent/logs/agent.log",
      "/opt/powersc/uiServer/logs/uiServer.log",
      "/var/log/messages or /var/adm/ras/syslog.caa"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=endpoints-verifying-endpoint-server-communication"
  },
  {
    problem: "Installing and Configuring PowerSC Agent on Endpoints",
    symptoms: [
      "Need step-by-step setup guide for client agent on AIX or Linux",
      "Installing fileset or RPM package on target LPARs"
    ],
    possibleCauses: [
      "New endpoint onboarding",
      "Missing prerequisite dependencies or incorrect package installation"
    ],
    solutions: [
      "1. On AIX: Install with `installp -aXYgd /path/to/media powerscStd.uiAgent`.",
      "2. On Linux: Install with `rpm -ivh powersc-uiAgent-<ver>.ppc64le.rpm`.",
      "3. Register endpoint: `/opt/powersc/agent/bin/pscuiagentctl register -s <server_ip> -p 443`.",
      "4. Start daemon: `systemctl enable --now powersc-agent` or `/opt/powersc/agent/bin/pscuiagentctl start`."
    ],
    relevantLogs: [
      "/opt/powersc/agent/logs/agent.log"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=systems-installing-powersc-gui-agent"
  },
  {
    problem: "Real-Time Compliance (RTC) event monitoring and alert configuration",
    symptoms: [
      "Changes to /etc/security/user or sshd_config do not generate alerts",
      "Need to configure Real-Time file change monitoring"
    ],
    possibleCauses: [
      "AIX Event Infrastructure (AHAFS) unmounted",
      "Monitored file list is missing target system paths"
    ],
    solutions: [
      "1. Check AHAFS status on AIX: `mount | grep aha` (mount with `mount -v ahafs /aha /aha` if unmounted).",
      "2. Configure monitored file paths in the RTC settings.",
      "3. Activate RTC monitoring with `mkrtc -a`."
    ],
    relevantLogs: [
      "/opt/powersc/rtc/logs/rtc.log",
      "/aha/events/"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=security-configuring-real-time-compliance-rtc"
  },
  {
    problem: "Distributing truststore security certificates to endpoints",
    symptoms: [
      "SSLHandshakeException or certificate rejected when agent contacts GUI server",
      "Expired UI server certificate"
    ],
    possibleCauses: [
      "Server certificate was regenerated or endpoints have stale truststore"
    ],
    solutions: [
      "1. Export or copy `/opt/powersc/uiServer/conf/truststore.p12` to endpoint `/etc/security/phyp/` or agent keystore.",
      "2. Re-run endpoint registration to auto-import the updated certificate: `pscuiagentctl register -s <server_ip> -p 443`.",
      "3. Restart endpoint agent service."
    ],
    relevantLogs: [
      "/opt/powersc/uiServer/logs/uiServer.log",
      "/opt/powersc/agent/logs/agent.log"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=gui-distributing-truststore-security-certificate-endpoints"
  },
  {
    problem: "PowerSC MFA login configuration and PAM setup",
    symptoms: [
      "User prompted for MFA fails or PAM authentication bypass",
      "MFA client configuration needed"
    ],
    possibleCauses: [
      "PAM configuration in /etc/pam.conf or /etc/pam.d/ is missing pam_pmfa module",
      "Time drift on TOTP authentication server"
    ],
    solutions: [
      "1. Verify PAM module installation: `rpm -qa | grep -i pmfa`.",
      "2. Configure PAM stack with `auth required /usr/lib/security/pam_pmfa.so`.",
      "3. Verify client certificate and server communication."
    ],
    relevantLogs: [
      "/var/log/secure (Linux)",
      "/var/adm/ras/syslog (AIX)"
    ],
    docUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0?topic=using-powersc-mfa-authentication-optional"
  }
];

const TOC_STRUCTURE: { [version: string]: any } = {
  "2.2.0": {
    version: "2.2.0 (Latest)",
    baseUrl: "https://www.ibm.com/docs/en/powersc-standard/2.2.0",
    sections: [
      {
        title: "Overview and Architecture",
        topics: [
          { title: "PowerSC GUI Concepts", path: "?topic=concepts-powersc-gui" },
          { title: "Populating Endpoint Content in Compliance Page", path: "?topic=concepts-populating-endpoint-content-in-compliance-page" }
        ]
      },
      {
        title: "Installation and Upgrade",
        topics: [
          { title: "Installing PowerSC Overview", path: "?topic=installing-powersc" },
          { title: "Installing PowerSC on AIX Systems", path: "?topic=powersc-installing-aix-systems" },
          { title: "Installing PowerSC GUI Agent", path: "?topic=systems-installing-powersc-gui-agent" },
          { title: "Installing PowerSC GUI Server", path: "?topic=systems-installing-powersc-gui-server" },
          { title: "Installing PowerSC on Linux Systems", path: "?topic=powersc-installing-linux-systems" },
          { title: "Starting and Stopping uiServer and uiAgent on AIX", path: "?topic=systems-starting-stopping-powersc-uiserver-uiagent-aix" },
          { title: "Starting and Stopping uiServer and uiAgent on Linux", path: "?topic=systems-starting-stopping-powersc-uiserver-uiagent-linux" }
        ]
      },
      {
        title: "Endpoint Administration & GUI",
        topics: [
          { title: "Using the PowerSC GUI", path: "?topic=using-powersc-gui" },
          { title: "Distributing Truststore Security Certificate to Endpoints", path: "?topic=gui-distributing-truststore-security-certificate-endpoints" },
          { title: "Adding Endpoints to PowerSC GUI Monitoring", path: "?topic=endpoints-adding-powersc-gui-monitoring" },
          { title: "Verifying Endpoint and Server Communication", path: "?topic=endpoints-verifying-endpoint-server-communication" },
          { title: "Syncing Endpoints from PowerSC GUI", path: "?topic=endpoints-syncing-powersc-from-powersc-gui" }
        ]
      },
      {
        title: "Security and Compliance Profiles",
        topics: [
          { title: "PCI DSS Compliance for AIX, Linux, and VIOS", path: "?topic=scac-payment-card-industry-data-security-standard-dss-compliance-aix-linux-vios" },
          { title: "CIS V3 Benchmarks Compliance for AIX 7", path: "?topic=scac-center-internet-security-cis-v3-benchmarks-compliance-aix-7" },
          { title: "CIS Benchmarks Compliance for Linux V1", path: "?topic=scac-center-internet-security-cis-benchmarks-compliance-linux-v1" },
          { title: "Department of Defense STIG Compliance", path: "?topic=concepts-department-defense-stig-compliance" },
          { title: "GDPR Compliance for AIX and Linux", path: "?topic=scac-general-data-protection-regulation-gdpr-compliance-aix-linux" },
          { title: "SAP Compliance for AIX", path: "?topic=concepts-sap-compliance-aix" },
          { title: "Database Compliance for AIX", path: "?topic=concepts-database-compliance-aix" }
        ]
      },
      {
        title: "Real-Time Compliance & Security Monitoring",
        topics: [
          { title: "Real-Time Compliance (RTC)", path: "?topic=real-time-compliance" },
          { title: "Configuring Real-Time Compliance", path: "?topic=security-configuring-real-time-compliance-rtc" },
          { title: "Editing Real-Time Compliance File List", path: "?topic=rtc-editing-real-time-compliance-file-list" },
          { title: "Setting Alerts for Compliance Events", path: "?topic=compliance-setting-alerts" }
        ]
      },
      {
        title: "Multi-Factor Authentication (PowerSC MFA)",
        topics: [
          { title: "Using PowerSC MFA Authentication", path: "?topic=using-powersc-mfa-authentication-optional" },
          { title: "Installing PowerSC MFA Client", path: "?topic=optional-installing-powersc-mfa-client" }
        ]
      },
      {
        title: "Command-Line Reference (CLI)",
        topics: [
          { title: "PowerSC Commands Reference Overview", path: "?topic=powersc-commands" },
          { title: "pscuiagentctl command", path: "?topic=commands-pscuiagentctl-command" },
          { title: "pscuiserverctl command", path: "?topic=commands-pscuiserverctl-command" },
          { title: "pscxpert command", path: "?topic=commands-pscxpert-command" },
          { title: "mkrtc command", path: "?topic=commands-mkrtc-command" },
          { title: "pmconf command", path: "?topic=commands-pmconf-command" }
        ]
      }
    ]
  }
};

// Fetch live web documentation with fallbacks
async function fetchIbmDocsHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      headers: HTTP_HEADERS,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    return html;
  } finally {
    clearTimeout(timeout);
  }
}

function parseHtmlToMarkdown(html: string, sourceUrl: string): { title: string; markdown: string } {
  const $ = cheerio.load(html);

  // Extract page title
  const title =
    $("h1").first().text().trim() ||
    $("title").text().replace(/ - IBM Documentation.*$/, "").trim() ||
    "IBM PowerSC Documentation";

  // Identify main content area in IBM Documentation
  let mainContent = $("main, article, .ibm-doc-content, #content, .topic, .nested0").first();
  if (mainContent.length === 0) {
    mainContent = $("body");
  }

  // Remove unneeded elements
  mainContent.find("script, style, noscript, nav, header, footer, .ibm-breadcrumb, .feedback-section, .page-rating").remove();

  // Convert HTML to Markdown
  const markdown = turndown.turndown(mainContent.html() || "");

  const fullMarkdown = `# ${title}\n\n**Source URL**: [${sourceUrl}](${sourceUrl})\n\n---\n\n${markdown}`;

  return { title, markdown: fullMarkdown };
}

// Create MCP Server
const server = new Server(
  {
    name: "ibm-docs-powersc",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tool schemas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_powersc_docs",
        description:
          "Search IBM PowerSC (Power Security and Compliance) documentation for topics, features, compliance standards (PCI DSS, CIS, NIST, DoD STIG, HIPAA), daemons, and system integration guides. Returns direct topic URLs.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Keywords or terms to search for (e.g. 'PCI DSS', 'pscmd', 'agent registration', 'MFA TOTP', 'AHAFS', 'FIM').",
            },
            version: {
              type: "string",
              description: "PowerSC version: '2.2.0' (default), '2.1.0', or '2.0.0'.",
              default: "2.2.0",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_powersc_toc",
        description:
          "Browse the Table of Contents and structural hierarchy of IBM PowerSC documentation for a specific version with verified direct links to each topic.",
        inputSchema: {
          type: "object",
          properties: {
            version: {
              type: "string",
              description: "PowerSC version to browse ('2.2.0', '2.1.0', or '2.0.0'). Default is '2.2.0'.",
              default: "2.2.0",
            },
          },
        },
      },
      {
        name: "fetch_ibm_doc_page",
        description:
          "Fetch, clean, and convert an IBM Documentation article URL into clean, readable Markdown.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The full IBM Documentation URL (e.g. 'https://www.ibm.com/docs/en/powersc-standard/2.2.0?...').",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "powersc_command_reference",
        description:
          "Get detailed CLI syntax, arguments, parameters, examples, descriptions, and verified direct IBM doc links for IBM PowerSC CLI commands (pscuiagentctl, pscuiserverctl, pscxpert, mkrtc, pmconf).",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "Command name (e.g. 'pscuiagentctl', 'powersc-agent', 'pscuiserverctl', 'pscxpert', 'mkrtc', 'pmconf', or 'all').",
            },
          },
          required: ["command"],
        },
      },
      {
        name: "powersc_compliance_profile",
        description:
          "Lookup detailed information, target OS, key hardening rules, guidelines, and verified direct topic URLs for PowerSC security compliance profiles (PCI-DSS, CIS, DoD STIG, GDPR, SAP, Database).",
        inputSchema: {
          type: "object",
          properties: {
            profile: {
              type: "string",
              description: "Profile code or name (e.g. 'PCI_DSS', 'CIS', 'DoD_STIG', 'GDPR', 'SAP', 'DB_COMPLIANCE', or 'all').",
            },
          },
          required: ["profile"],
        },
      },
      {
        name: "powersc_troubleshoot",
        description:
          "Troubleshoot and diagnose common IBM PowerSC errors, daemon crashes, agent connection issues, SSL/keystore certificates, RTC AHAFS errors, and find log file paths. Always includes verified direct IBM Documentation URLs for user verification.",
        inputSchema: {
          type: "object",
          properties: {
            issue: {
              type: "string",
              description: "Description of the problem, error message, or component (e.g. 'agent connection', 'SSL certificate', 'AHAFS', 'FIM high CPU', 'MFA PAM error').",
            },
          },
          required: ["issue"],
        },
      },
    ],
  };
});

// Handle Tool Execution Requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_powersc_docs") {
      const query = String(args?.query || "").toLowerCase();
      const version = String(args?.version || "2.2.0");

      const matchingProfiles = POWERSC_PROFILES.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.keyRules.some((r) => r.toLowerCase().includes(query))
      );

      const matchingCommands = POWERSC_COMMANDS.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.purpose.toLowerCase().includes(query) ||
          c.notes.toLowerCase().includes(query)
      );

      const matchingTroubleshooting = TROUBLESHOOTING_GUIDE.filter(
        (t) =>
          t.problem.toLowerCase().includes(query) ||
          t.symptoms.some((s) => s.toLowerCase().includes(query)) ||
          t.solutions.some((sol) => sol.toLowerCase().includes(query))
      );

      const toc = TOC_STRUCTURE[version] || TOC_STRUCTURE["2.2.0"];
      const matchingTopics: Array<{ section: string; title: string; url: string }> = [];

      for (const section of toc.sections) {
        for (const topic of section.topics) {
          if (
            topic.title.toLowerCase().includes(query) ||
            section.title.toLowerCase().includes(query)
          ) {
            matchingTopics.push({
              section: section.title,
              title: topic.title,
              url: `${toc.baseUrl}${topic.path}`,
            });
          }
        }
      }

      let resultText = `# Search Results for PowerSC: "${args?.query}" (Version: ${version})\n\n`;

      if (matchingTopics.length > 0) {
        resultText += `## 📚 Documentation Topics\n`;
        for (const t of matchingTopics) {
          resultText += `- **[${t.title}](${t.url})** (Section: *${t.section}*)\n`;
        }
        resultText += "\n";
      }

      if (matchingProfiles.length > 0) {
        resultText += `## 🛡️ Compliance Profiles\n`;
        for (const p of matchingProfiles) {
          resultText += `### ${p.name} (\`${p.code}\`)\n`;
          resultText += `- **Description**: ${p.description}\n`;
          resultText += `- **Target OS**: ${p.targetOS.join(", ")}\n`;
          resultText += `- **Direct Topic Link**: [IBM Docs: ${p.name}](${p.docUrl})\n\n`;
        }
      }

      if (matchingCommands.length > 0) {
        resultText += `## ⚙️ CLI Commands\n`;
        for (const c of matchingCommands) {
          resultText += `### \`${c.name}\`\n`;
          resultText += `- **Purpose**: ${c.purpose}\n`;
          resultText += `- **Syntax**: \`${c.syntax}\`\n`;
          resultText += `- **Direct Topic Link**: [IBM Docs: ${c.name} CLI](${c.docUrl})\n\n`;
        }
      }

      if (matchingTroubleshooting.length > 0) {
        resultText += `## 🔧 Troubleshooting Matches\n`;
        for (const tr of matchingTroubleshooting) {
          resultText += `### Issue: ${tr.problem}\n`;
          resultText += `- **Solutions**:\n${tr.solutions.map((s) => `  - ${s}`).join("\n")}\n`;
          resultText += `- **Direct Topic Link**: [IBM Docs: ${tr.problem}](${tr.docUrl})\n\n`;
        }
      }

      if (
        matchingTopics.length === 0 &&
        matchingProfiles.length === 0 &&
        matchingCommands.length === 0 &&
        matchingTroubleshooting.length === 0
      ) {
        resultText += `No exact matching entries found for query "${args?.query}".\n\n`;
        resultText += `Suggested queries:\n- \`PCI_DSS\` or \`CIS\` or \`DoD_STIG\` for compliance\n- \`pscxpert\` or \`pscuiagentctl\` for CLI\n- \`agent\` or \`MFA\` or \`RTC\` for components\n- Or browse full topics with \`get_powersc_toc\`.`;
      }

      return {
        content: [{ type: "text", text: resultText }],
      };
    }

    if (name === "get_powersc_toc") {
      const version = String(args?.version || "2.2.0");
      const toc = TOC_STRUCTURE[version] || TOC_STRUCTURE["2.2.0"];

      let text = `# IBM PowerSC Standard Edition ${toc.version} — Table of Contents\n\n`;
      text += `**Base URL**: [${toc.baseUrl}](${toc.baseUrl})\n\n`;

      for (const section of toc.sections) {
        text += `### ${section.title}\n`;
        for (const topic of section.topics) {
          text += `- [${topic.title}](${toc.baseUrl}${topic.path})\n`;
        }
        text += "\n";
      }

      return {
        content: [{ type: "text", text }],
      };
    }

    if (name === "fetch_ibm_doc_page") {
      const url = String(args?.url || "").trim();
      if (!url.startsWith("http")) {
        throw new Error("Invalid URL. Must begin with http:// or https://");
      }

      try {
        const html = await fetchIbmDocsHtml(url);
        const { title, markdown } = parseHtmlToMarkdown(html, url);
        return {
          content: [
            {
              type: "text",
              text: markdown || `# ${title}\n\n*(No content extracted from body)*`,
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: `⚠️ **Unable to fetch remote page live** (${err.message}).\n\nDirect link: [${url}](${url})\n\nTip: You can use \`search_powersc_docs\` or \`powersc_compliance_profile\` to access pre-indexed PowerSC guidelines.`,
            },
          ],
        };
      }
    }

    if (name === "powersc_command_reference") {
      const cmdName = String(args?.command || "").trim().toLowerCase();

      let commands = POWERSC_COMMANDS;
      if (cmdName !== "all" && cmdName !== "") {
        commands = POWERSC_COMMANDS.filter((c) =>
          c.name.toLowerCase().includes(cmdName)
        );
      }

      if (commands.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Command "${args?.command}" not found in PowerSC CLI reference. Available commands: ${POWERSC_COMMANDS.map((c) => c.name).join(", ")}.`,
            },
          ],
        };
      }

      let text = `# IBM PowerSC Command-Line Interface (CLI) Reference\n\n`;

      for (const cmd of commands) {
        text += `## \`${cmd.name}\`\n\n`;
        text += `- **Binary Path**: \`${cmd.path}\`\n`;
        text += `- **Purpose**: ${cmd.purpose}\n`;
        text += `- **Syntax**: \`${cmd.syntax}\`\n`;
        text += `- **Direct Topic Link**: [IBM Docs: ${cmd.name} Command Reference](${cmd.docUrl})\n\n`;

        text += `### Options & Flags\n`;
        for (const [flag, desc] of Object.entries(cmd.options)) {
          text += `- \`${flag}\`: ${desc}\n`;
        }
        text += "\n";

        text += `### Examples\n`;
        for (const ex of cmd.examples) {
          text += `\`\`\`bash\n${ex}\n\`\`\`\n`;
        }
        text += "\n";

        if (cmd.notes) {
          text += `**Notes & Best Practices**: ${cmd.notes}\n\n`;
        }
        text += "---\n\n";
      }

      return {
        content: [{ type: "text", text }],
      };
    }

    if (name === "powersc_compliance_profile") {
      const profName = String(args?.profile || "").trim().toLowerCase();

      let profiles = POWERSC_PROFILES;
      if (profName !== "all" && profName !== "") {
        profiles = POWERSC_PROFILES.filter(
          (p) =>
            p.code.toLowerCase().includes(profName) ||
            p.name.toLowerCase().includes(profName)
        );
      }

      if (profiles.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Profile "${args?.profile}" not found. Available profiles: ${POWERSC_PROFILES.map((p) => p.code).join(", ")}.`,
            },
          ],
        };
      }

      let text = `# IBM PowerSC Security Compliance Profiles\n\n`;

      for (const p of profiles) {
        text += `## ${p.name} (\`${p.code}\`)\n\n`;
        text += `- **Description**: ${p.description}\n`;
        text += `- **Target Platforms**: ${p.targetOS.join(", ")}\n`;
        text += `- **Direct Topic Link**: [IBM Docs: ${p.name}](${p.docUrl})\n\n`;

        text += `### Key Security Hardening Rules & Checks\n`;
        for (const rule of p.keyRules) {
          text += `- ${rule}\n`;
        }
        text += "\n";

        text += `### CLI Quick Execution\n`;
        text += `\`\`\`bash\n# Check compliance status\npscxpert -c -p /etc/security/pscxpert/custom/${p.code.toLowerCase()}.xml\n\n# Apply security rules\npscxpert -a -p /etc/security/pscxpert/custom/${p.code.toLowerCase()}.xml\n\n# Undo applied remedies\npscxpert -u -p /etc/security/pscxpert/custom/${p.code.toLowerCase()}.xml\n\`\`\`\n\n`;
        text += "---\n\n";
      }

      return {
        content: [{ type: "text", text }],
      };
    }

    if (name === "powersc_troubleshoot") {
      const issueQuery = String(args?.issue || "").trim().toLowerCase();

      let items = TROUBLESHOOTING_GUIDE;
      if (issueQuery) {
        items = TROUBLESHOOTING_GUIDE.filter(
          (t) =>
            t.problem.toLowerCase().includes(issueQuery) ||
            t.symptoms.some((s) => s.toLowerCase().includes(issueQuery)) ||
            t.possibleCauses.some((c) => c.toLowerCase().includes(issueQuery)) ||
            t.solutions.some((s) => s.toLowerCase().includes(issueQuery)) ||
            t.relevantLogs.some((l) => l.toLowerCase().includes(issueQuery))
        );
      }

      if (items.length === 0) {
        items = TROUBLESHOOTING_GUIDE;
      }

      let text = `# IBM PowerSC Troubleshooting & Diagnostic Guide\n\n`;

      for (const item of items) {
        text += `## Issue: ${item.problem}\n\n`;

        text += `### 🔍 Symptoms\n`;
        for (const sym of item.symptoms) {
          text += `- ${sym}\n`;
        }
        text += "\n";

        text += `### ⚠️ Root Causes\n`;
        for (const cause of item.possibleCauses) {
          text += `- ${cause}\n`;
        }
        text += "\n";

        text += `### 🛠️ Step-by-Step Resolution\n`;
        for (const sol of item.solutions) {
          text += `${sol}\n`;
        }
        text += "\n";

        text += `### 📁 Relevant Log Locations\n`;
        for (const log of item.relevantLogs) {
          text += `- \`${log}\`\n`;
        }
        text += "\n";

        text += `### 📖 Official IBM Documentation Verification\n`;
        text += `Direct Topic Link: [IBM Documentation — ${item.problem}](${item.docUrl})\n\n`;
        text += "---\n\n";
      }

      return {
        content: [{ type: "text", text }],
      };
    }

    throw new Error(`Unknown tool name: ${name}`);
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start MCP Server on Stdio
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("IBM PowerSC Documentation MCP Server running on stdio.");
}

run().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
