"""LangGraph agent powered by local Ollama (`gemma4:12b-mlx`) and KanbanFlow MCP tools."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Sequence

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import BaseTool
from langchain_ollama import ChatOllama
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

try:
    from .config import AgentConfig
except ImportError:  # pragma: no cover - direct script execution
    from config import AgentConfig

SYSTEM_PROMPT = """You are the KanbanFlow AI Task Assistant connected directly to a Kanban board through Model Context Protocol (MCP) tools.

Your job is to help the user create, organize, inspect, update, move, and archive tasks on their KanbanFlow board accurately and reliably.

Board model & conventions:
- Default column slugs: `backlog`, `in_progress`, `review`, `done` (call `list_columns` if you need to check for custom columns).
- Valid priorities: `low`, `medium`, `high`, `urgent` (default: `medium`).
- Valid card types:
  - `task` (default standard card)
  - `blocker` (a card that blocks other cards; link via `blocking_ids`)
  - `blocked` (a card waiting on one or more blockers; link via `blocker_ids`)
- `acceptance_criteria` and `definition_of_done`: newline-separated plain text items. Prefix completed items with `[x] `.
- `due_date`: `YYYY-MM-DD` format when specified.

Rules for tool use:
1. ALWAYS use the MCP tools to read or modify the board. Never claim a task was created, updated, or moved unless the corresponding MCP tool succeeded.
2. When creating a task with `create_task`, include a clear `title`, appropriate `column_slug`, `priority`, `card_type`, `description`, `acceptance_criteria`, `definition_of_done`, and `due_date` whenever the user supplies or implies them.
3. When creating a `blocker` and a `blocked` task together, create the `blocker` task FIRST, inspect the returned `id`, and then create the `blocked` task with `card_type="blocked"` and `blocker_ids=[<blocker_id>]`.
4. Before permanently deleting tasks (`delete_task`) or bulk-archiving (`archive_done_tasks`), only proceed if the user explicitly asked for it.
5. After every action, summarize concisely what was done, always reporting each affected task's numeric `#id`, title, column, priority, card type, and any linked blockers or checklists.
"""


@dataclass
class AgentTurnResult:
    """Structured output of a single LangGraph agent turn."""

    response: str
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    messages: list[BaseMessage] = field(default_factory=list)


def create_ollama_llm(config: AgentConfig) -> ChatOllama:
    """Instantiate the local Ollama chat model (`gemma4:12b-mlx` by default)."""
    kwargs: dict[str, Any] = {
        "model": config.model,
        "base_url": config.ollama_base_url,
        "temperature": config.temperature,
    }
    if config.num_ctx is not None:
        kwargs["num_ctx"] = config.num_ctx
    return ChatOllama(**kwargs)


def build_kanban_agent(
    llm: BaseChatModel,
    tools: Sequence[BaseTool],
    *,
    system_prompt: str = SYSTEM_PROMPT,
    checkpointer: Any | None = None,
):
    """Compile a LangGraph ReAct tool-calling StateGraph for KanbanFlow MCP operations.

    Graph flow:
        START -> agent -> (tools_condition) -> tools -> agent
                                            -> END
    """
    tool_list = list(tools)
    bound_llm = llm.bind_tools(tool_list)

    async def call_model(state: MessagesState) -> dict[str, list[BaseMessage]]:
        prompt_messages: list[BaseMessage] = [SystemMessage(content=system_prompt)]
        prompt_messages.extend(state["messages"])
        ai_message = await bound_llm.ainvoke(prompt_messages)
        return {"messages": [ai_message]}

    graph = StateGraph(MessagesState)
    graph.add_node("agent", call_model)
    graph.add_node("tools", ToolNode(tool_list))

    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", tools_condition, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    return graph.compile(checkpointer=checkpointer if checkpointer is not None else InMemorySaver())


def _extract_text_content(content: Any) -> str:
    """Normalize LangChain message content (string or block list) into plain text."""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text", "")))
        return "\n".join(part for part in parts if part).strip()
    return str(content).strip()


def _extract_turn_slice(messages: Sequence[BaseMessage]) -> list[BaseMessage]:
    """Return only messages from the latest HumanMessage onward."""
    last_human_idx = 0
    for idx, msg in enumerate(messages):
        if isinstance(msg, HumanMessage):
            last_human_idx = idx
    return list(messages[last_human_idx:])


async def run_agent_turn(
    agent_graph: Any,
    user_prompt: str,
    *,
    thread_id: str = "default",
    recursion_limit: int = 20,
) -> AgentTurnResult:
    """Execute one user turn against the compiled LangGraph agent."""
    result = await agent_graph.ainvoke(
        {"messages": [HumanMessage(content=user_prompt)]},
        config={
            "configurable": {"thread_id": thread_id},
            "recursion_limit": recursion_limit,
        },
    )

    all_messages: list[BaseMessage] = list(result.get("messages", []))
    turn_messages = _extract_turn_slice(all_messages)

    tool_outputs_by_id: dict[str, str] = {}
    for msg in turn_messages:
        if isinstance(msg, ToolMessage) and getattr(msg, "tool_call_id", None):
            tool_outputs_by_id[str(msg.tool_call_id)] = _extract_text_content(msg.content)

    tool_calls: list[dict[str, Any]] = []
    final_response = ""
    for msg in turn_messages:
        if isinstance(msg, AIMessage):
            for call in getattr(msg, "tool_calls", None) or []:
                call_id = str(call.get("id", ""))
                tool_calls.append(
                    {
                        "id": call_id,
                        "name": call.get("name", ""),
                        "args": call.get("args", {}),
                        "output": tool_outputs_by_id.get(call_id, ""),
                    }
                )
            text = _extract_text_content(msg.content)
            if text:
                final_response = text

    return AgentTurnResult(
        response=final_response,
        tool_calls=tool_calls,
        messages=turn_messages,
    )
