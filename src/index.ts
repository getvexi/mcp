#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.VEXI_API_KEY;
const BASE_URL = "https://getvexi.dev/api/v1";

if (!API_KEY) {
  console.error("Error: VEXI_API_KEY environment variable is required");
  process.exit(1);
}

console.error(
  "VEXI_API_KEY loaded:",
  API_KEY ? "YES (" + API_KEY.substring(0, 8) + "...)" : "NO"
);

async function vexiRequest(endpoint: string, params?: Record<string, string>) {
  try {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) url.searchParams.set(k, v);
      });
    }
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    return res.json();
  } catch (error) {
    console.error("vexiRequest error:", error);
    return { error: String(error) };
  }
}

async function vexiPost(endpoint: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return res.json();
  } catch (error) {
    console.error("vexiPost error:", error);
    return { error: String(error) };
  }
}

const server = new Server(
  { name: "vexi", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_businesses",
      description:
        "Search for businesses by query and location. Returns Agent Business Objects (ABOs).\nWhen total_crawling > 0 in the response, inform the user that some results are still being crawled and ask if they want to wait — if yes, call this tool again with wait=true.",
      inputSchema: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "Search query (business name, keyword, or free-text)",
          },
          location: {
            type: "string",
            description: "City, state, country, or geo hint (optional)",
          },
          business_type: {
            type: "string",
            description: "Business type or category filter (optional)",
          },
          limit: {
            type: "string",
            description: "Max number of results to return (optional)",
          },
          min_completeness: {
            type: "string",
            description: "Minimum ABO completeness score 0-1 (optional)",
          },
          wait: {
            type: "boolean",
            description:
              "Wait up to 90 seconds for crawls to complete before returning. Use when user wants fresh results.",
          },
        },
      },
    },
    {
      name: "get_business",
      description: "Get a full ABO for a specific business by slug.",
      inputSchema: {
        type: "object",
        properties: {
          slug: {
            type: "string",
            description: "Business slug identifier",
          },
        },
        required: ["slug"],
      },
    },
    {
      name: "crawl_business",
      description: "Queue a new business for crawling from a URL.",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "Website URL to crawl",
          },
          wait: {
            type: "boolean",
            description: "Wait for crawl to complete before returning (optional)",
          },
        },
        required: ["url"],
      },
    },
    {
      name: "list_categories",
      description: "List all available business categories.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const name = request.params.name;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;

    if (name === "search_businesses") {
      const params = {
        q: String(args.q ?? ""),
        location: String(args.location ?? ""),
        business_type: String(args.business_type ?? ""),
        limit: String(args.limit ?? ""),
        min_completeness: String(args.min_completeness ?? ""),
        ...(args.wait ? { wait: "true" } : {}),
      };
      const data = await vexiRequest("/search", params);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    if (name === "get_business") {
      const slug = String(args.slug ?? "");
      if (!slug) {
        throw new Error("slug is required");
      }
      const data = await vexiRequest(`/business/${encodeURIComponent(slug)}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    if (name === "crawl_business") {
      const body: Record<string, unknown> = {
        url: args.url,
      };
      if (args.wait !== undefined) {
        body.wait = args.wait;
      }
      const data = await vexiPost("/crawl", body);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    if (name === "list_categories") {
      const data = await vexiRequest("/categories");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { error: error instanceof Error ? error.message : String(error) },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal MCP server error:", error);
  process.exit(1);
});
