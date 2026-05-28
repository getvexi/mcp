# @getvexi/mcp

[npm version](https://www.npmjs.com/package/@getvexi/mcp)
[License: MIT](LICENSE)
[Website](https://getvexi.dev)

**Structured business data for AI agents - connect Claude, Cursor, and any MCP-compatible client to the Vexi API in 30 seconds.**

---

## What is Vexi?

Vexi is a structured business data API designed for AI agents. Instead of scraping and parsing raw HTML, your agent gets a clean, typed **Agent Business Object (ABO)** - a JSON document with identity, offerings, contact channels, trust signals, and quality metadata.

With one call, agents can discover businesses, fetch full records, and request fresh crawls when data is missing or stale.

---

## Prerequisites

- **Node.js 18+**
- A **Vexi API key** - get one free at [https://getvexi.dev/signup](https://getvexi.dev/signup)

---

## Installation

### Claude Desktop

1. Open your Claude Desktop MCP configuration file:
  - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
  - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
2. Add or merge the `vexi` server entry under `mcpServers`.
3. Paste the following configuration (replace the API key with yours):

```json
{
  "mcpServers": {
    "vexi": {
      "command": "npx",
      "args": ["-y", "@getvexi/mcp"],
      "env": {
        "VEXI_API_KEY": "vxi_live_..."
      }
    }
  }
}
```

1. Save the file and fully quit Claude Desktop.
2. Relaunch Claude Desktop - the **vexi** tools should appear in your MCP tools list.

### Cursor

1. Open **Cursor**.
2. Go to **Settings > MCP**.
3. Add a new server:
  - **Command:** `npx`
  - **Args:** `-y`, `@getvexi/mcp`
  - **Env:** `VEXI_API_KEY=vxi_live_...`
4. Save and restart Cursor.

### Other MCP clients

Run the server via stdio:

```bash
npx -y @getvexi/mcp
```

Set `VEXI_API_KEY` in the process environment before starting the client.

---

## Available Tools


| Tool                | Description                                    |
| ------------------- | ---------------------------------------------- |
| `search_businesses` | Search for businesses by query and location    |
| `get_business`      | Get a full ABO for a specific business by slug |
| `crawl_business`    | Queue a new business for crawling              |
| `list_categories`   | List all available business categories         |


---

## Example Usage

**User:** Find the top 3 CRM platforms in the US.

**Claude** calls `search_businesses`:

```json
{
  "query": "CRM platform",
  "location": "US",
  "limit": "3"
}
```

**Claude:** Here are three CRM platforms in the US:


| Business   | Completeness |
| ---------- | ------------ |
| HubSpot    | 0.94         |
| Salesforce | 0.97         |
| Pipedrive  | 0.89         |


---

**User:** Give me full details on HubSpot.

**Claude** calls `get_business`:

```json
{
  "slug": "hubspot"
}
```

**Claude:** Returns the full ABO for HubSpot - identity, offerings, contact channels, trust signals, operations, agent interface hints, and quality metadata in one structured document.

---

## ABO Schema

Every business is returned as an **Agent Business Object** with eight top-level sections:

```json
{
  "identity": {
    "id": "biz_hubspot",
    "name": "HubSpot",
    "slug": "hubspot"
  },
  "offerings": {
    "products": ["CRM", "Marketing Hub", "Sales Hub"],
    "price_range": "$$"
  },
  "location": {
    "headquarters": "Cambridge, MA",
    "country": "US"
  },
  "contact": {
    "website": "https://hubspot.com",
    "email": "support@hubspot.com"
  },
  "trust": {
    "rating": 4.5,
    "review_count": 12000
  },
  "operations": {
    "founded_year": 2006,
    "employee_range": "5000+"
  },
  "agent_interface": {
    "summary": "Inbound marketing and CRM platform for SMBs and enterprises",
    "suggested_queries": ["Compare pricing tiers", "List integrations"]
  },
  "quality": {
    "completeness_score": 0.94,
    "last_updated": "2026-05-28T12:00:00Z"
  }
}
```

---

## Get your API Key

Sign up at **[https://getvexi.dev/signup](https://getvexi.dev/signup)**.

Start free with **500 credits** - no credit card required.

---

## Links

- **Website:** [https://getvexi.dev](https://getvexi.dev)
- **API Docs:** [https://getvexi.dev/docs](https://getvexi.dev/docs)
- **Dashboard:** [https://getvexi.dev/dashboard](https://getvexi.dev/dashboard)
- **npm:** [https://www.npmjs.com/package/@getvexi/mcp](https://www.npmjs.com/package/@getvexi/mcp)

---

## License

MIT