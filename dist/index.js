#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const API_KEY = process.env.VEXI_API_KEY;
const BASE_URL = "https://api.getvexi.dev/v1";
if (!API_KEY) {
    console.error("Error: VEXI_API_KEY environment variable is required");
    process.exit(1);
}
async function vexiRequest(endpoint, params) {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v)
                url.searchParams.set(k, v);
        });
    }
    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Vexi API GET ${endpoint} failed (${res.status}): ${text}`);
    }
    return res.json();
}
async function vexiPost(endpoint, body) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Vexi API POST ${endpoint} failed (${res.status}): ${text}`);
    }
    return res.json();
}
const server = new index_js_1.Server({ name: "vexi", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "search_businesses",
            description: "Search for businesses by query, location, and category. Returns Agent Business Objects (ABOs).",
            inputSchema: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Business name, keyword, or free-text search query",
                    },
                    location: {
                        type: "string",
                        description: "City, state, country, or geo hint (optional)",
                    },
                    category: {
                        type: "string",
                        description: "Business category filter (optional)",
                    },
                    limit: {
                        type: "string",
                        description: "Max number of results to return (optional)",
                    },
                },
            },
        },
        {
            name: "enrich_business",
            description: "Enrich a business profile using known identifiers and return structured details.",
            inputSchema: {
                type: "object",
                properties: {
                    businessId: {
                        type: "string",
                        description: "Vexi business ID when available",
                    },
                    domain: {
                        type: "string",
                        description: "Company website domain (optional)",
                    },
                    name: {
                        type: "string",
                        description: "Business name (optional)",
                    },
                },
            },
        },
    ],
}));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    try {
        const name = request.params.name;
        const args = (request.params.arguments ?? {});
        if (name === "search_businesses") {
            const params = {
                query: String(args.query ?? ""),
                location: String(args.location ?? ""),
                category: String(args.category ?? ""),
                limit: String(args.limit ?? ""),
            };
            const data = await vexiRequest("/businesses/search", params);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        }
        if (name === "enrich_business") {
            const body = {
                businessId: args.businessId,
                domain: args.domain,
                name: args.name,
            };
            const data = await vexiPost("/businesses/enrich", body);
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
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2),
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("Fatal MCP server error:", error);
    process.exit(1);
});
