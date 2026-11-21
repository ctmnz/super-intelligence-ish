"""Async MCP stdio bridge loading KanbanFlow's MCP tools into LangChain."""

from __future__ import annotations

from contextlib import AsyncExitStack
import json
import os
from typing import Any

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.tools import load_mcp_tools
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

try:
    from .config import AgentConfig
except ImportError:  # pragma: no cover - direct script execution
    from config import AgentConfig


class KanbanMCPBridge:
    """Manages a persistent stdio MCP session with `mcp_server/server.py`.

    Usage:
        async with KanbanMCPBridge(config) as bridge:
            tools = bridge.tools
            ...
    """

    def __init__(self, config: AgentConfig) -> None:
        self.config = config
        self._stack: AsyncExitStack | None = None
        self.session: ClientSession | None = None
        self.tools: list[BaseTool] = []
        self.server_info: dict[str, Any] = {}

    @property
    def tool_names(self) -> list[str]:
        return [tool.name for tool in self.tools]

    def _build_server_params(self) -> StdioServerParameters:
        if not self.config.mcp_server_script.exists():
            raise FileNotFoundError(
                f"KanbanFlow MCP server script not found: {self.config.mcp_server_script}"
            )

        env = os.environ.copy()
        env["KANBAN_DB_PATH"] = str(self.config.db_path)
        env["KANBAN_SEED_SAMPLE_TASKS"] = "1" if self.config.seed_sample_tasks else "0"

        return StdioServerParameters(
            command=self.config.mcp_python,
            args=[str(self.config.mcp_server_script)],
            env=env,
        )

    async def __aenter__(self) -> "KanbanMCPBridge":
        stack = AsyncExitStack()
        self._stack = stack
        try:
            params = self._build_server_params()
            read_stream, write_stream = await stack.enter_async_context(stdio_client(params))
            session = await stack.enter_async_context(ClientSession(read_stream, write_stream))
            init_result = await session.initialize()

            self.session = session
            if init_result.serverInfo is not None:
                self.server_info = {
                    "name": init_result.serverInfo.name,
                    "version": init_result.serverInfo.version,
                }
            self.tools = await load_mcp_tools(session)
            return self
        except Exception:
            await stack.aclose()
            self._stack = None
            self.session = None
            self.tools = []
            raise

    async def __aexit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        if self._stack is not None:
            await self._stack.aclose()
        self._stack = None
        self.session = None
        self.tools = []

    async def read_resource_json(self, uri: str) -> dict[str, Any]:
        """Read and decode a JSON resource exposed by the KanbanFlow MCP server."""
        if self.session is None:
            raise RuntimeError("KanbanMCPBridge is not connected.")
        result = await self.session.read_resource(uri)
        if not result.contents:
            return {}
        text = getattr(result.contents[0], "text", "") or "{}"
        return json.loads(text)

    async def read_board_snapshot(self) -> dict[str, Any]:
        """Fetch the current board snapshot via the `kanban://board` MCP resource."""
        return await self.read_resource_json("kanban://board")
