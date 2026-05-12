"""Article search and retrieval tools for MCP."""

from mcp.server import Server
from mcp.types import Tool, TextContent


def register_article_tools(server: Server) -> None:
    """Register article-related MCP tools."""

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        return [
            Tool(
                name="search_articles",
                description="Search the article corpus by keyword, category, or date range",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search keywords"},
                        "category": {"type": "string", "description": "Filter by category: politics|business|technology|health|environment|culture|indigenous|energy"},
                        "limit": {"type": "integer", "description": "Max results (default 20)", "default": 20},
                    },
                },
            ),
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        if name != "search_articles":
            raise ValueError(f"Unknown tool: {name}")

        return [TextContent(
            type="text",
            text=f"[civint-mcp] search_articles(query={arguments.get('query')}, category={arguments.get('category')}, limit={arguments.get('limit', 20)}) — pipeline backend not yet connected",
        )]
