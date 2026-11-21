"""LangChain + LangGraph local Ollama agent integrated with KanbanFlow's MCP server."""

from .agent import AgentTurnResult, SYSTEM_PROMPT, build_kanban_agent, create_ollama_llm, run_agent_turn
from .config import AgentConfig, OllamaHealth, check_ollama_health
from .mcp_bridge import KanbanMCPBridge

__all__ = [
    "AgentConfig",
    "AgentTurnResult",
    "KanbanMCPBridge",
    "OllamaHealth",
    "SYSTEM_PROMPT",
    "build_kanban_agent",
    "check_ollama_health",
    "create_ollama_llm",
    "run_agent_turn",
]
