"""Citation verification tools for MCP."""

from mcp.server import Server
from mcp.types import Tool, TextContent


def register_verification_tools(server: Server) -> None:
    """Register citation verification tools."""

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        if name != "get_citation":
            raise ValueError(f"Unknown tool: {name}")

        return [TextContent(
            type="text",
            text=f"[civint-mcp] get_citation(article_id={arguments.get('article_id')}) — pipeline backend not yet connected",
        )]
