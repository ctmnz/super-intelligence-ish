"""Configuration and Ollama health-check helpers for the KanbanFlow LangGraph agent."""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path
import sys
from typing import Any

import httpx

PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = PACKAGE_DIR.parent

DEFAULT_OLLAMA_MODEL = "gemma4:12b-mlx"
DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434"
DEFAULT_TEMPERATURE = 0.2
DEFAULT_RECURSION_LIMIT = 20


@dataclass(frozen=True)
class AgentConfig:
    """Runtime settings for the Ollama LLM and KanbanFlow MCP stdio bridge."""

    model: str = DEFAULT_OLLAMA_MODEL
    ollama_base_url: str = DEFAULT_OLLAMA_BASE_URL
    temperature: float = DEFAULT_TEMPERATURE
    num_ctx: int | None = None
    db_path: Path = PROJECT_ROOT / "kanban.db"
    mcp_server_script: Path = PROJECT_ROOT / "mcp_server" / "server.py"
    mcp_python: str = sys.executable
    seed_sample_tasks: bool = True
    recursion_limit: int = DEFAULT_RECURSION_LIMIT

    @classmethod
    def from_env(
        cls,
        *,
        model: str | None = None,
        ollama_base_url: str | None = None,
        temperature: float | None = None,
        num_ctx: int | None = None,
        db_path: str | Path | None = None,
        mcp_server_script: str | Path | None = None,
        mcp_python: str | None = None,
        seed_sample_tasks: bool | None = None,
        recursion_limit: int | None = None,
    ) -> "AgentConfig":
        """Build an AgentConfig using explicit overrides, environment variables, and defaults."""
        env_temp = os.environ.get("OLLAMA_TEMPERATURE")
        resolved_temp = (
            float(temperature)
            if temperature is not None
            else (float(env_temp) if env_temp else DEFAULT_TEMPERATURE)
        )

        env_ctx = os.environ.get("OLLAMA_NUM_CTX")
        resolved_ctx = (
            int(num_ctx)
            if num_ctx is not None
            else (int(env_ctx) if env_ctx else None)
        )

        env_db = os.environ.get("KANBAN_DB_PATH")
        resolved_db = (
            Path(db_path).expanduser().resolve()
            if db_path is not None
            else (Path(env_db).expanduser().resolve() if env_db else (PROJECT_ROOT / "kanban.db"))
        )

        env_script = os.environ.get("KANBAN_MCP_SERVER_SCRIPT")
        resolved_script = (
            Path(mcp_server_script).expanduser().resolve()
            if mcp_server_script is not None
            else (
                Path(env_script).expanduser().resolve()
                if env_script
                else (PROJECT_ROOT / "mcp_server" / "server.py")
            )
        )

        env_seed = os.environ.get("KANBAN_SEED_SAMPLE_TASKS")
        resolved_seed = (
            seed_sample_tasks
            if seed_sample_tasks is not None
            else (env_seed != "0" if env_seed is not None else True)
        )

        env_limit = os.environ.get("AGENT_RECURSION_LIMIT")
        resolved_limit = (
            int(recursion_limit)
            if recursion_limit is not None
            else (int(env_limit) if env_limit else DEFAULT_RECURSION_LIMIT)
        )

        return cls(
            model=model or os.environ.get("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL),
            ollama_base_url=(
                ollama_base_url or os.environ.get("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL)
            ).rstrip("/"),
            temperature=resolved_temp,
            num_ctx=resolved_ctx,
            db_path=resolved_db,
            mcp_server_script=resolved_script,
            mcp_python=mcp_python or os.environ.get("KANBAN_MCP_PYTHON") or sys.executable,
            seed_sample_tasks=resolved_seed,
            recursion_limit=resolved_limit,
        )


@dataclass(frozen=True)
class OllamaHealth:
    """Result of checking local Ollama server reachability and model availability."""

    reachable: bool
    model_available: bool
    base_url: str
    model: str
    installed_models: tuple[str, ...] = ()
    error: str | None = None


def check_ollama_health(
    base_url: str = DEFAULT_OLLAMA_BASE_URL,
    model: str = DEFAULT_OLLAMA_MODEL,
    *,
    timeout: float = 5.0,
) -> OllamaHealth:
    """Verify Ollama is responding and whether the configured model is pulled locally."""
    url = f"{base_url.rstrip('/')}/api/tags"
    try:
        response = httpx.get(url, timeout=timeout)
        response.raise_for_status()
        payload: dict[str, Any] = response.json()
    except Exception as exc:
        return OllamaHealth(
            reachable=False,
            model_available=False,
            base_url=base_url.rstrip("/"),
            model=model,
            error=str(exc),
        )

    models_raw = payload.get("models") or []
    installed = tuple(
        str(entry.get("name"))
        for entry in models_raw
        if isinstance(entry, dict) and entry.get("name")
    )
    target = model.strip()
    available = any(
        name == target or name == f"{target}:latest" or name.split(":")[0] == target
        for name in installed
    )
    return OllamaHealth(
        reachable=True,
        model_available=available,
        base_url=base_url.rstrip("/"),
        model=target,
        installed_models=installed,
    )
