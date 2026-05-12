"""Fact-checking tools for MCP."""

from mcp.server import Server
from mcp.types import Tool, TextContent


def register_fact_check_tools(server: Server) -> None:
    """Register fact-checking tools."""

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        if name != "fact_check":
            raise ValueError(f"Unknown tool: {name}")

        return [TextContent(
            type="text",
            text=f"[civint-mcp] fact_check(claim={arguments.get('claim')}) — pipeline backend not yet connected",
        )]
