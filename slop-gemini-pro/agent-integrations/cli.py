"""Command-line interface for the KanbanFlow Ollama + LangGraph MCP agent.

Run from the project root:
    # 1. Verify Ollama (`gemma4:12b-mlx`) and KanbanFlow MCP server connectivity
    agent-integrations/.venv/bin/python agent-integrations/cli.py --check

    # 2. Start interactive chat session (writes to kanban.db)
    agent-integrations/.venv/bin/python agent-integrations/cli.py

    # 3. Single-shot task creation
    agent-integrations/.venv/bin/python agent-integrations/cli.py \
        --prompt "Create a high-priority task in backlog titled 'Add OAuth PKCE flow'"
"""

from __future__ import annotations

import argparse
import asyncio
from pathlib import Path
import sys
import tempfile
import uuid
from typing import Sequence

# Allow execution both as `python agent-integrations/cli.py` and via module import
THIS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = THIS_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))

from config import AgentConfig, DEFAULT_OLLAMA_BASE_URL, DEFAULT_OLLAMA_MODEL, check_ollama_health  # noqa: E402
from mcp_bridge import KanbanMCPBridge  # noqa: E402
from agent import AgentTurnResult, build_kanban_agent, create_ollama_llm, run_agent_turn  # noqa: E402


HELP_TEXT = """Commands:
  /board    Show current Kanban columns and active task counts
  /tools    List all MCP tools loaded from mcp_server/server.py
  /clear    Reset conversation memory (starts a new LangGraph thread)
  /help     Show this help message
  /exit     Quit the agent

Example prompts:
  - Create a high-priority task in Backlog titled "Add rate limiting" with acceptance criteria
  - Create a blocker task in In Progress for "Provision Redis cluster" and a blocked task in Backlog for "Enable session caching"
  - Show all urgent or blocked tasks currently on the board
  - Move task #5 to review and mark its first acceptance criterion done
"""


def _print_tool_trace(turn: AgentTurnResult) -> None:
    if not turn.tool_calls:
        return
    print("\n--- MCP Tool Calls ---")
    for idx, call in enumerate(turn.tool_calls, start=1):
        print(f"  [{idx}] {call['name']}({call['args']})")
        output = call.get("output", "")
        if output:
            preview = output if len(output) <= 600 else output[:600] + "\n  ... (truncated)"
            for line in preview.splitlines():
                print(f"      {line}")
    print("----------------------")


def _print_board_summary(snapshot: dict) -> None:
    columns = snapshot.get("columns") or []
    archived_count = snapshot.get("archived_count", 0)
    print("\nKanbanFlow Board Snapshot:")
    for col in columns:
        tasks = col.get("tasks") or []
        wip = col.get("wip_limit")
        count_label = f"{len(tasks)}/{wip}" if wip else str(len(tasks))
        print(f"  - {col['name']} ({col['slug']}): {count_label} task(s)")
        for task in tasks[:5]:
            ctype = f" [{task['card_type']}]" if task.get("card_type") != "task" else ""
            print(f"      #{task['id']} ({task['priority']}){ctype} {task['title']}")
        if len(tasks) > 5:
            print(f"      ... and {len(tasks) - 5} more")
    print(f"  Archived tasks: {archived_count}\n")


async def _run_preflight(config: AgentConfig) -> int:
    print("KanbanFlow Agent Preflight Check")
    print("=" * 40)
    print(f"Model:      {config.model}")
    print(f"Ollama URL: {config.ollama_base_url}")
    print(f"MCP Server: {config.mcp_server_script}")
    print(f"SQLite DB:  {config.db_path}")
    print()

    ok = True

    # 1. Check MCP Server over stdio
    try:
        async with KanbanMCPBridge(config) as bridge:
            snapshot = await bridge.read_board_snapshot()
            cols = snapshot.get("columns") or []
            total_tasks = sum(len(c.get("tasks") or []) for c in cols)
            print(
                f"[OK] MCP Server: {bridge.server_info.get('name', 'kanbanflow-mcp')} "
                f"v{bridge.server_info.get('version', '?')} — {len(bridge.tools)} tools loaded"
            )
            print(f"     Tools: {', '.join(bridge.tool_names)}")
            print(
                f"     Board: {len(cols)} columns, {total_tasks} active tasks, "
                f"{snapshot.get('archived_count', 0)} archived"
            )
    except Exception as exc:
        ok = False
        print(f"[FAIL] MCP Server connection failed: {exc}")

    # 2. Check Ollama server & model
    health = check_ollama_health(config.ollama_base_url, config.model)
    if not health.reachable:
        ok = False
        print(f"[FAIL] Ollama unreachable at {health.base_url}: {health.error}")
        print("       Start Ollama with: ollama serve")
    elif not health.model_available:
        ok = False
        print(f"[WARN] Ollama is running at {health.base_url}, but model '{health.model}' was not found.")
        print(f"       Installed models: {', '.join(health.installed_models) or '(none)'}")
        print(f"       Pull it with: ollama pull {health.model}")
    else:
        print(f"[OK] Ollama: reachable at {health.base_url}, model '{health.model}' is available.")

    return 0 if ok else 1


async def _run_agent_session(
    config: AgentConfig,
    *,
    prompt: str | None,
    thread_id: str,
    verbose: bool,
    skip_health_check: bool,
) -> int:
    if not skip_health_check:
        health = check_ollama_health(config.ollama_base_url, config.model)
        if not health.reachable:
            print(
                f"Error: Cannot reach Ollama at {health.base_url} ({health.error}).\n"
                "Start Ollama first (`ollama serve`) or pass --ollama-url.",
                file=sys.stderr,
            )
            return 1
        if not health.model_available:
            print(
                f"Error: Model '{health.model}' is not installed in Ollama.\n"
                f"Pull it first: ollama pull {health.model}\n"
                f"Installed models: {', '.join(health.installed_models) or '(none)'}",
                file=sys.stderr,
            )
            return 1

    async with KanbanMCPBridge(config) as bridge:
        llm = create_ollama_llm(config)
        agent_graph = build_kanban_agent(llm, bridge.tools)

        # Single-shot mode
        if prompt:
            turn = await run_agent_turn(
                agent_graph,
                prompt,
                thread_id=thread_id,
                recursion_limit=config.recursion_limit,
            )
            if verbose:
                _print_tool_trace(turn)
            print(turn.response)
            return 0

        # Interactive REPL mode
        print(
            f"KanbanFlow LangGraph Agent ready | model={config.model} | "
            f"db={config.db_path} | tools={len(bridge.tools)}"
        )
        print("Type a request to create/manage tasks, or /help for commands.\n")

        current_thread = thread_id
        while True:
            try:
                user_input = input("you> ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\nGoodbye!")
                return 0

            if not user_input:
                continue

            cmd = user_input.lower()
            if cmd in {"/exit", "/quit", "exit", "quit"}:
                print("Goodbye!")
                return 0
            if cmd == "/help":
                print(HELP_TEXT)
                continue
            if cmd == "/tools":
                print("Loaded MCP tools:", ", ".join(bridge.tool_names))
                continue
            if cmd == "/board":
                snapshot = await bridge.read_board_snapshot()
                _print_board_summary(snapshot)
                continue
            if cmd == "/clear":
                current_thread = f"session-{uuid.uuid4().hex[:8]}"
                print(f"Started fresh conversation thread ({current_thread}).\n")
                continue

            try:
                turn = await run_agent_turn(
                    agent_graph,
                    user_input,
                    thread_id=current_thread,
                    recursion_limit=config.recursion_limit,
                )
            except Exception as exc:
                print(f"\n[Error] Agent turn failed: {exc}\n", file=sys.stderr)
                continue

            if verbose:
                _print_tool_trace(turn)
            print(f"\nagent> {turn.response}\n")


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "KanbanFlow LangChain + LangGraph agent powered by local Ollama "
            f"({DEFAULT_OLLAMA_MODEL}) using the project's MCP stdio server."
        )
    )
    parser.add_argument(
        "prompt_words",
        nargs="*",
        help="Optional single-shot prompt (alternative to --prompt).",
    )
    parser.add_argument(
        "-p",
        "--prompt",
        default=None,
        help="Run a single instruction and exit instead of launching interactive chat.",
    )
    parser.add_argument(
        "-m",
        "--model",
        default=None,
        help=f"Ollama model name (default: $OLLAMA_MODEL or {DEFAULT_OLLAMA_MODEL}).",
    )
    parser.add_argument(
        "--ollama-url",
        default=None,
        help=f"Ollama base URL (default: $OLLAMA_BASE_URL or {DEFAULT_OLLAMA_BASE_URL}).",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=None,
        help="Sampling temperature for Ollama (default: 0.2).",
    )
    parser.add_argument(
        "--num-ctx",
        type=int,
        default=None,
        help="Optional Ollama context window size (e.g. 8192 or 16384).",
    )
    parser.add_argument(
        "--db-path",
        default=None,
        help="Path to KanbanFlow SQLite database (default: <project_root>/kanban.db).",
    )
    parser.add_argument(
        "--temp-db",
        action="store_true",
        help="Use an isolated temporary SQLite database instead of kanban.db.",
    )
    parser.add_argument(
        "--thread-id",
        default="interactive",
        help="LangGraph checkpointer thread ID for conversation memory.",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Print MCP tool calls and JSON responses on each turn.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify MCP server tools and Ollama model availability, then exit.",
    )
    parser.add_argument(
        "--skip-health-check",
        action="store_true",
        help="Skip initial Ollama /api/tags preflight check before starting.",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    prompt = args.prompt or (" ".join(args.prompt_words).strip() if args.prompt_words else None)

    tmpdir = tempfile.TemporaryDirectory() if args.temp_db else None
    try:
        db_path = (
            Path(tmpdir.name) / "temp_kanban.db"
            if tmpdir is not None
            else args.db_path
        )
        config = AgentConfig.from_env(
            model=args.model,
            ollama_base_url=args.ollama_url,
            temperature=args.temperature,
            num_ctx=args.num_ctx,
            db_path=db_path,
        )

        if args.check:
            return asyncio.run(_run_preflight(config))

        return asyncio.run(
            _run_agent_session(
                config,
                prompt=prompt,
                thread_id=args.thread_id,
                verbose=args.verbose,
                skip_health_check=args.skip_health_check,
            )
        )
    finally:
        if tmpdir is not None:
            tmpdir.cleanup()


if __name__ == "__main__":
    raise SystemExit(main())
