"""End-to-end automated tests for the KanbanFlow LangChain + LangGraph MCP agent.

Verifies:
1. AgentConfig defaults (`gemma4:12b-mlx`) and environment overrides.
2. KanbanMCPBridge connecting over stdio to the real `mcp_server/server.py`,
   discovering all 12 MCP tools as LangChain BaseTools, and reading resources.
3. Full LangGraph StateGraph execution creating tasks, linking blocker/blocked
   dependencies, and preserving multi-turn thread memory against a real
   temporary SQLite database (no live Ollama server required for unit tests).
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from typing import Any, Callable, Sequence
from unittest.mock import patch

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, ToolMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.runnables import Runnable
from langchain_core.tools import BaseTool

THIS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = THIS_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

import database as db  # noqa: E402
from agent import build_kanban_agent, create_ollama_llm, run_agent_turn  # noqa: E402
from config import AgentConfig, DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL  # noqa: E402
from mcp_bridge import KanbanMCPBridge  # noqa: E402


class ScriptedToolChatModel(BaseChatModel):
    """Deterministic tool-calling chat model for testing LangGraph + real MCP tools."""

    responder: Callable[[list[BaseMessage], list[str]], AIMessage]
    bound_tool_names: list[str] = []

    @property
    def _llm_type(self) -> str:
        return "scripted-tool-chat-model"

    def bind_tools(
        self,
        tools: Sequence[dict[str, Any] | type | Callable[..., Any] | BaseTool],
        *,
        tool_choice: str | None = None,
        **kwargs: Any,
    ) -> Runnable[Any, AIMessage]:
        names = [
            tool.name if isinstance(tool, BaseTool) else getattr(tool, "__name__", str(tool))
            for tool in tools
        ]
        return ScriptedToolChatModel(responder=self.responder, bound_tool_names=names)

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        ai_msg = self.responder(messages, self.bound_tool_names)
        return ChatResult(generations=[ChatGeneration(message=ai_msg)])

    async def _agenerate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        return self._generate(messages, stop=stop, run_manager=run_manager, **kwargs)


def _last_tool_payload(messages: list[BaseMessage]) -> dict[str, Any]:
    for msg in reversed(messages):
        if isinstance(msg, ToolMessage):
            raw = msg.content
            if isinstance(raw, list):
                raw = "\n".join(
                    block.get("text", "") if isinstance(block, dict) else str(block)
                    for block in raw
                )
            return json.loads(str(raw))
    return {}


class KanbanLangGraphAgentTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self._tmpdir.name) / "test_agent_kanban.db"

    def tearDown(self) -> None:
        self._tmpdir.cleanup()

    def test_config_defaults_and_env_overrides(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            cfg = AgentConfig.from_env()
            self.assertEqual(cfg.model, DEFAULT_OLLAMA_MODEL)
            self.assertEqual(cfg.model, "gemma4:12b-mlx")
            self.assertEqual(cfg.ollama_base_url, DEFAULT_OLLAMA_BASE_URL)
            self.assertEqual(cfg.db_path, PROJECT_ROOT / "kanban.db")
            self.assertEqual(cfg.mcp_server_script, PROJECT_ROOT / "mcp_server" / "server.py")

            llm = create_ollama_llm(cfg)
            self.assertEqual(llm.model, "gemma4:12b-mlx")
            self.assertEqual(llm.base_url, DEFAULT_OLLAMA_BASE_URL)

        with patch.dict(
            os.environ,
            {
                "OLLAMA_MODEL": "gemma4:12b-mlx",
                "OLLAMA_BASE_URL": "http://localhost:11434/",
                "OLLAMA_TEMPERATURE": "0.1",
                "OLLAMA_NUM_CTX": "16384",
                "KANBAN_DB_PATH": str(self.db_path),
                "KANBAN_SEED_SAMPLE_TASKS": "0",
            },
            clear=True,
        ):
            cfg = AgentConfig.from_env()
            self.assertEqual(cfg.ollama_base_url, "http://localhost:11434")
            self.assertAlmostEqual(cfg.temperature, 0.1)
            self.assertEqual(cfg.num_ctx, 16384)
            self.assertEqual(cfg.db_path, self.db_path.resolve())
            self.assertFalse(cfg.seed_sample_tasks)

    async def test_mcp_bridge_loads_all_tools_and_board_resource(self) -> None:
        cfg = AgentConfig.from_env(db_path=self.db_path, seed_sample_tasks=False)
        async with KanbanMCPBridge(cfg) as bridge:
            self.assertEqual(bridge.server_info.get("name"), "kanbanflow-mcp")
            expected_tools = {
                "get_board",
                "list_columns",
                "list_tasks",
                "get_task",
                "create_task",
                "update_task",
                "move_task",
                "delete_task",
                "list_archived_tasks",
                "archive_task",
                "archive_done_tasks",
                "restore_task",
            }
            self.assertEqual(set(bridge.tool_names), expected_tools)

            snapshot = await bridge.read_board_snapshot()
            self.assertEqual(len(snapshot["columns"]), 4)
            self.assertEqual(snapshot["archived_count"], 0)

    async def test_agent_creates_rich_task_via_real_mcp_server(self) -> None:
        cfg = AgentConfig.from_env(db_path=self.db_path, seed_sample_tasks=False)

        def responder(messages: list[BaseMessage], tool_names: list[str]) -> AIMessage:
            self.assertIn("create_task", tool_names)
            if not isinstance(messages[-1], ToolMessage):
                return AIMessage(
                    content="",
                    tool_calls=[
                        {
                            "id": "call_create_1",
                            "name": "create_task",
                            "args": {
                                "title": "Implement OAuth2 PKCE login",
                                "column_slug": "backlog",
                                "priority": "high",
                                "card_type": "task",
                                "due_date": "2026-12-15",
                                "description": "Replace password-only sign-in with PKCE flow.",
                                "acceptance_criteria": "PKCE challenge verified\nRefresh token rotation enabled",
                                "definition_of_done": "Unit tests green\nSecurity review complete",
                            },
                        }
                    ],
                )
            created = _last_tool_payload(messages)
            return AIMessage(
                content=(
                    f"Created task #{created['id']}: {created['title']} "
                    f"(priority={created['priority']}, due={created['due_date']})."
                )
            )

        async with KanbanMCPBridge(cfg) as bridge:
            agent_graph = build_kanban_agent(ScriptedToolChatModel(responder=responder), bridge.tools)
            turn = await run_agent_turn(
                agent_graph,
                "Create a high-priority task in Backlog for OAuth2 PKCE login due 2026-12-15.",
                thread_id="test-create-task",
            )

        self.assertEqual(len(turn.tool_calls), 1)
        self.assertEqual(turn.tool_calls[0]["name"], "create_task")
        self.assertIn("Implement OAuth2 PKCE login", turn.response)

        tasks = db.list_tasks(db_path=self.db_path)
        self.assertEqual(len(tasks), 1)
        created_task = tasks[0]
        self.assertEqual(created_task["title"], "Implement OAuth2 PKCE login")
        self.assertEqual(created_task["priority"], "high")
        self.assertEqual(created_task["due_date"], "2026-12-15")
        self.assertIn("PKCE challenge verified", created_task["acceptance_criteria"])
        self.assertIn("Security review complete", created_task["definition_of_done"])

    async def test_agent_creates_linked_blocker_and_moves_in_followup_turn(self) -> None:
        cfg = AgentConfig.from_env(db_path=self.db_path, seed_sample_tasks=False)
        state_tracker: dict[str, int] = {}

        def responder(messages: list[BaseMessage], _tool_names: list[str]) -> AIMessage:
            last = messages[-1]
            # Turn 1, Step 1: create blocker
            if not isinstance(last, ToolMessage) and "Provision Redis" in str(last.content):
                return AIMessage(
                    content="",
                    tool_calls=[
                        {
                            "id": "call_blocker",
                            "name": "create_task",
                            "args": {
                                "title": "Provision Redis cluster",
                                "column_slug": "in_progress",
                                "priority": "urgent",
                                "card_type": "blocker",
                            },
                        }
                    ],
                )
            # Turn 1, Step 2: create blocked task referencing blocker_id
            if isinstance(last, ToolMessage) and last.tool_call_id == "call_blocker":
                blocker = _last_tool_payload(messages)
                state_tracker["blocker_id"] = int(blocker["id"])
                return AIMessage(
                    content="",
                    tool_calls=[
                        {
                            "id": "call_blocked",
                            "name": "create_task",
                            "args": {
                                "title": "Enable distributed session caching",
                                "column_slug": "backlog",
                                "priority": "high",
                                "card_type": "blocked",
                                "blocker_ids": [state_tracker["blocker_id"]],
                            },
                        }
                    ],
                )
            # Turn 1, Step 3: confirm both cards
            if isinstance(last, ToolMessage) and last.tool_call_id == "call_blocked":
                blocked = _last_tool_payload(messages)
                state_tracker["blocked_id"] = int(blocked["id"])
                return AIMessage(
                    content=(
                        f"Created blocker #{state_tracker['blocker_id']} and "
                        f"blocked card #{state_tracker['blocked_id']}."
                    )
                )
            # Turn 2, Step 1: move the blocker created in Turn 1 to review
            if not isinstance(last, ToolMessage) and "Move that blocker" in str(last.content):
                return AIMessage(
                    content="",
                    tool_calls=[
                        {
                            "id": "call_move",
                            "name": "move_task",
                            "args": {
                                "task_id": state_tracker["blocker_id"],
                                "column_slug": "review",
                            },
                        }
                    ],
                )
            if isinstance(last, ToolMessage) and last.tool_call_id == "call_move":
                moved = _last_tool_payload(messages)
                return AIMessage(content=f"Moved task #{moved['id']} to Review.")

            return AIMessage(content="Done.")

        async with KanbanMCPBridge(cfg) as bridge:
            agent_graph = build_kanban_agent(ScriptedToolChatModel(responder=responder), bridge.tools)

            turn1 = await run_agent_turn(
                agent_graph,
                "Create a blocker 'Provision Redis' and a blocked task 'Enable distributed session caching'.",
                thread_id="multi-turn-thread",
            )
            self.assertEqual([c["name"] for c in turn1.tool_calls], ["create_task", "create_task"])

            turn2 = await run_agent_turn(
                agent_graph,
                "Move that blocker to review.",
                thread_id="multi-turn-thread",
            )
            self.assertEqual([c["name"] for c in turn2.tool_calls], ["move_task"])
            self.assertIn("Review", turn2.response)

        blocker_task = db.get_task(state_tracker["blocker_id"], db_path=self.db_path)
        blocked_task = db.get_task(state_tracker["blocked_id"], db_path=self.db_path)
        columns_by_slug = {c["slug"]: c["id"] for c in db.list_columns(db_path=self.db_path)}

        self.assertIsNotNone(blocker_task)
        self.assertIsNotNone(blocked_task)
        assert blocker_task and blocked_task
        self.assertEqual(blocker_task["card_type"], "blocker")
        self.assertEqual(blocker_task["column_id"], columns_by_slug["review"])
        self.assertEqual(blocked_task["card_type"], "blocked")
        self.assertEqual(blocked_task["blocker_ids"], [blocker_task["id"]])


if __name__ == "__main__":
    unittest.main()
