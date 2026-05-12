"""Government data query tools for MCP."""

from mcp.server import Server
from mcp.types import Tool, TextContent


def register_gov_data_tools(server: Server) -> None:
    """Register government data query tools."""

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        if name != "query_gov_data":
            raise ValueError(f"Unknown tool: {name}")

        return [TextContent(
            type="text",
            text=f"[civint-mcp] query_gov_data(jurisdiction={arguments.get('jurisdiction')}, category={arguments.get('category')}) — pipeline backend not yet connected",
        )]
