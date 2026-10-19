# IBM PowerSC Documentation MCP Server

MCP server untuk mencari dan membaca dokumentasi **IBM PowerSC** (Power Security and Compliance) langsung dari Bob. Jawaban selalu menyertakan link dokumentasi resmi IBM.

## Cara Pakai (3 langkah)

**Syarat:** [Node.js](https://nodejs.org) sudah terinstall.

1. **Download** repo ini (tombol hijau **Code → Download ZIP**, lalu extract) atau `git clone https://github.com/cavlord/ibm-docs-mcp.git`.
2. **Buka IBM Bob → Open Folder** → pilih folder hasil download tadi.
3. **Ketik prompt ini di chat Bob:**

   ```
   Buatkan MCP server ini: jalankan npm install dan build di folder ibm-docs-mcp-server, lalu atur .bob/mcp.json dengan path absolut folder ini.
   ```

Selesai. Setelah Bob selesai, MCP `ibm-docs-powersc` langsung bisa dipakai. Kalau belum muncul, reload Bob.

## Contoh Pertanyaan

- "Bagaimana konfigurasi File Integrity Monitoring di PowerSC 2.2.0?"
- "Tunjukkan syntax `pscxpert`."
- "Apa saja yang dicek profil PCI DSS?"
- "Agent PowerSC tidak bisa connect, error SSL certificate. Cara troubleshoot-nya?"

## Tools yang Tersedia

| Tool | Fungsi |
| :--- | :--- |
| `search_powersc_docs` | Cari topik, command, profil compliance, dan error PowerSC |
| `get_powersc_toc` | Lihat daftar isi dokumentasi PowerSC (2.2.0, 2.1.0, 2.0.0) |
| `fetch_ibm_doc_page` | Ambil halaman IBM Documentation dan ubah ke Markdown |
| `powersc_command_reference` | Syntax dan contoh command (`pscxpert`, `mkrtc`, `pmconf`, dll.) |
| `powersc_compliance_profile` | Aturan profil PCI DSS, CIS, DoD STIG, GDPR, SAP, dll. |
| `powersc_troubleshoot` | Solusi masalah agent, SSL, AHAFS, FIM, MFA, dan lokasi log |

## Manual (opsional)

Kalau tidak mau minta Bob, jalankan sendiri:

```powershell
cd ibm-docs-mcp-server
npm install
npm run build
```

Lalu tambahkan ke `.bob/mcp.json` (pakai **path absolut** ke `build/index.js`):

```json
{
  "mcpServers": {
    "ibm-docs-powersc": {
      "command": "node",
      "args": ["C:\\path\\ke\\ibm-docs-mcp\\ibm-docs-mcp-server\\build\\index.js"]
    }
  }
}
```
