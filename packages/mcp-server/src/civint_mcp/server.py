"""
MCP server entry point — registers tools for AI agent consumption.
"""

from mcp.server import Server
from mcp.server.stdio import stdio_server


def main() -> None:
    """Run the MCP server over stdio transport."""
    import anyio
    from .tools.articles import register_article_tools
    from .tools.gov_data import register_gov_data_tools
    from .tools.fact_check import register_fact_check_tools
    from .tools.verification import register_verification_tools

    server = Server("civint-mcp")

    register_article_tools(server)
    register_gov_data_tools(server)
    register_fact_check_tools(server)
    register_verification_tools(server)

    async def _run() -> None:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(read_stream, write_stream, server.create_initialization_options())

    anyio.run(_run)


if __name__ == "__main__":
    main()
