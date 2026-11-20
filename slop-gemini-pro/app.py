"""Flask application and REST API for the local-first Kanban board."""

from __future__ import annotations

import os
from typing import Any

from flask import Flask, jsonify, render_template, request
from opentelemetry.trace import StatusCode

import database as db
from openapi_spec import build_openapi_spec
from telemetry import setup_telemetry


def create_app(
    db_path: str | None = None,
    seed_sample_tasks: bool = True,
    *,
    telemetry_kwargs: dict[str, Any] | None = None,
) -> Flask:
    """Application factory for the Kanban Flask server."""
    app = Flask(__name__)
    app.config["DB_PATH"] = db_path

    def _db_path() -> str | None:
        return app.config.get("DB_PATH")

    db.init_db(db_path=_db_path(), seed_sample_tasks=seed_sample_tasks)

    otel = setup_telemetry(app, _db_path, **(telemetry_kwargs or {}))
    app.extensions["telemetry"] = otel

    # ------------------------------------------------------------------
    # Health Probe (Kubernetes liveness / readiness)
    # ------------------------------------------------------------------

    @app.get("/healthz")
    def healthz():
        try:
            with db.get_connection(_db_path()) as conn:
                conn.execute("SELECT 1").fetchone()
            return jsonify({"status": "ok"}), 200
        except Exception as exc:
            otel.logger.error("Health check failed: %s", exc)
            return jsonify({"status": "error", "detail": str(exc)}), 503

    # ------------------------------------------------------------------
    # OpenAPI & Swagger UI
    # ------------------------------------------------------------------

    @app.get("/openapi.json")
    def openapi_json():
        return jsonify(build_openapi_spec(server_url="/"))

    @app.get("/docs")
    @app.get("/swagger")
    def swagger_ui():
        return render_template("swagger.html")

    # ------------------------------------------------------------------
    # Frontend View (Jinja2)
    # ------------------------------------------------------------------

    @app.get("/")
    def index():
        columns = db.get_board(db_path=_db_path())
        total_tasks = sum(len(col["tasks"]) for col in columns)
        archived_count = db.count_archived_tasks(db_path=_db_path())
        return render_template(
            "index.html",
            columns=columns,
            priorities=db.VALID_PRIORITIES,
            card_types=db.VALID_CARD_TYPES,
            total_tasks=total_tasks,
            archived_count=archived_count,
        )

    # ------------------------------------------------------------------
    # Board Endpoint
    # ------------------------------------------------------------------

    @app.get("/api/board")
    def api_get_board():
        priority = request.args.get("priority")
        card_type = request.args.get("card_type")
        query = request.args.get("q")
        with otel.tracer.start_as_current_span("kanban.board.get") as span:
            if priority:
                span.set_attribute("kanban.filter.priority", priority)
            if card_type:
                span.set_attribute("kanban.filter.card_type", card_type)
            columns = db.get_board(
                priority=priority,
                card_type=card_type,
                query=query,
                db_path=_db_path(),
            )
            archived_count = db.count_archived_tasks(db_path=_db_path())
            span.set_attribute("kanban.columns.count", len(columns))
            span.set_attribute("kanban.archived.count", archived_count)
            return jsonify({"columns": columns, "archived_count": archived_count})

    # ------------------------------------------------------------------
    # Column CRUD Endpoints
    # ------------------------------------------------------------------

    @app.get("/api/columns")
    def api_list_columns():
        return jsonify({"columns": db.list_columns(db_path=_db_path())})

    @app.post("/api/columns")
    def api_create_column():
        payload: dict[str, Any] = request.get_json(silent=True) or {}
        name = payload.get("name", "")
        color = payload.get("color", "#64748b")
        slug = payload.get("slug")
        with otel.tracer.start_as_current_span("kanban.column.create") as span:
            try:
                column = db.create_column(name=name, color=color, slug=slug, db_path=_db_path())
            except ValueError as exc:
                span.set_status(StatusCode.ERROR, str(exc))
                return jsonify({"error": str(exc)}), 400
            span.set_attribute("kanban.column.id", column["id"])
            span.set_attribute("kanban.column.slug", column["slug"])
            otel.logger.info(
                "Created column '%s' (id=%s)",
                column["name"],
                column["id"],
                extra={"column_id": column["id"], "column_slug": column["slug"]},
            )
            return jsonify(column), 201

    @app.route("/api/columns/<int:column_id>", methods=["PUT", "PATCH"])
    def api_update_column(column_id: int):
        payload: dict[str, Any] = request.get_json(silent=True) or {}
        with otel.tracer.start_as_current_span("kanban.column.update") as span:
            span.set_attribute("kanban.column.id", column_id)
            try:
                updated = db.update_column(
                    column_id,
                    name=payload.get("name"),
                    color=payload.get("color"),
                    position=payload.get("position"),
                    db_path=_db_path(),
                )
            except (ValueError, TypeError) as exc:
                span.set_status(StatusCode.ERROR, str(exc))
                return jsonify({"error": str(exc)}), 400
            if not updated:
                return jsonify({"error": "Column not found."}), 404
            otel.logger.info("Updated column id=%s", column_id, extra={"column_id": column_id})
            return jsonify(updated)

    @app.delete("/api/columns/<int:column_id>")
    def api_delete_column(column_id: int):
        with otel.tracer.start_as_current_span("kanban.column.delete") as span:
            span.set_attribute("kanban.column.id", column_id)
            if not db.delete_column(column_id, db_path=_db_path()):
                return jsonify({"error": "Column not found."}), 404
            otel.logger.info("Deleted column id=%s", column_id, extra={"column_id": column_id})
            return jsonify({"deleted": True, "id": column_id})

    # ------------------------------------------------------------------
    # Task CRUD Endpoints
    # ------------------------------------------------------------------

    @app.get("/api/tasks")
    def api_list_tasks():
        raw_col = request.args.get("column_id")
        column_id = None
        if raw_col is not None and raw_col != "":
            try:
                column_id = int(raw_col)
            except ValueError:
                return jsonify({"error": "column_id must be an integer."}), 400

        tasks = db.list_tasks(
            column_id=column_id,
            priority=request.args.get("priority"),
            card_type=request.args.get("card_type"),
            query=request.args.get("q"),
            db_path=_db_path(),
        )
        return jsonify({"tasks": tasks})

    @app.get("/api/tasks/<int:task_id>")
    def api_get_task(task_id: int):
        task = db.get_task(task_id, db_path=_db_path())
        if not task:
            return jsonify({"error": "Task not found."}), 404
        return jsonify(task)

    @app.post("/api/tasks")
    def api_create_task():
        payload: dict[str, Any] = request.get_json(silent=True) or {}
        title = payload.get("title", "")
        description = payload.get("description", "")
        acceptance_criteria = payload.get("acceptance_criteria", "")
        definition_of_done = payload.get("definition_of_done", "")
        priority = payload.get("priority", "medium")
        card_type = payload.get("card_type", "task")
        due_date = payload.get("due_date")
        blocker_ids = payload.get("blocker_ids")
        blocking_ids = payload.get("blocking_ids")

        raw_column_id = payload.get("column_id")
        if raw_column_id is None:
            columns = db.list_columns(db_path=_db_path())
            if not columns:
                return jsonify({"error": "No columns available."}), 400
            column_id = columns[0]["id"]
        else:
            try:
                column_id = int(raw_column_id)
            except (TypeError, ValueError):
                return jsonify({"error": "column_id must be an integer."}), 400

        with otel.tracer.start_as_current_span("kanban.task.create") as span:
            span.set_attribute("kanban.column.id", column_id)
            try:
                task = db.create_task(
                    title=title,
                    column_id=column_id,
                    description=description,
                    acceptance_criteria=acceptance_criteria,
                    definition_of_done=definition_of_done,
                    priority=priority,
                    card_type=card_type,
                    due_date=due_date,
                    blocker_ids=blocker_ids,
                    blocking_ids=blocking_ids,
                    db_path=_db_path(),
                )
            except ValueError as exc:
                span.set_status(StatusCode.ERROR, str(exc))
                otel.logger.warning("Task creation rejected: %s", exc)
                return jsonify({"error": str(exc)}), 400
            except LookupError as exc:
                span.set_status(StatusCode.ERROR, str(exc))
                return jsonify({"error": str(exc)}), 404

            span.set_attribute("kanban.task.id", task["id"])
            span.set_attribute("kanban.task.priority", task["priority"])
            span.set_attribute("kanban.task.card_type", task["card_type"])
            span.set_attribute("kanban.blocker.count", len(task.get("blocker_ids", [])))

            otel.tasks_created.add(
                1, {"priority": task["priority"], "card_type": task["card_type"]}
            )
            otel.logger.info(
                "Created task #%s '%s' [%s/%s]",
                task["id"],
                task["title"],
                task["card_type"],
                task["priority"],
                extra={
                    "task_id": task["id"],
                    "column_id": task["column_id"],
                    "card_type": task["card_type"],
                    "priority": task["priority"],
                },
            )
            return jsonify(task), 201

    @app.route("/api/tasks/<int:task_id>", methods=["PUT", "PATCH"])
    def api_update_task(task_id: int):
        payload: dict[str, Any] = request.get_json(silent=True) or {}
        kwargs: dict[str, Any] = {"db_path": _db_path()}

        if "title" in payload:
            kwargs["title"] = payload["title"]
        if "description" in payload:
            kwargs["description"] = payload["description"]
        if "acceptance_criteria" in payload:
            kwargs["acceptance_criteria"] = payload["acceptance_criteria"]
        if "definition_of_done" in payload:
            kwargs["definition_of_done"] = payload["definition_of_done"]
        if "priority" in payload:
            kwargs["priority"] = payload["priority"]
        if "card_type" in payload:
            kwargs["card_type"] = payload["card_type"]
        if "blocker_ids" in payload:
            kwargs["blocker_ids"] = payload["blocker_ids"]
        if "blocking_ids" in payload:
            kwargs["blocking_ids"] = payload["blocking_ids"]
        if "column_id" in payload and payload["column_id"] is not None:
            try:
                kwargs["column_id"] = int(payload["column_id"])
            except (TypeError, ValueError):
                return jsonify({"error": "column_id must be an integer."}), 400
        if "due_date" in payload:
            kwargs["due_date"] = payload["due_date"]

        with otel.tracer.start_as_current_span("kanban.task.update") as span:
            span.set_attribute("kanban.task.id", task_id)
            try:
                updated = db.update_task(task_id, **kwargs)
            except ValueError as exc:
                span.set_status(StatusCode.ERROR, str(exc))
                return jsonify({"error": str(exc)}), 400
            except LookupError as exc:
                span.set_status(StatusCode.ERROR, str(exc))
                return jsonify({"error": str(exc)}), 404

            if not updated:
                return jsonify({"error": "Task not found."}), 404

            span.set_attribute("kanban.task.priority", updated["priority"])
            span.set_attribute("kanban.task.card_type", updated["card_type"])
            otel.logger.info(
                "Updated task #%s",
                task_id,
                extra={
                    "task_id": task_id,
                    "column_id": updated["column_id"],
                    "card_type": updated["card_type"],
                },
            )
            return jsonify(updated)

    @app.patch("/api/tasks/<int:task_id>/move")
    def api_move_task(task_id: int):
        payload: dict[str, Any] = request.get_json(silent=True) or {}
        if "column_id" not in payload:
            return jsonify({"error": "column_id is required."}), 400
        try:
            target_column_id = int(payload["column_id"])
            raw_pos = payload.get("position")
            target_position = None if raw_pos is None else int(raw_pos)
        except (TypeError, ValueError):
            return jsonify({"error": "column_id and position must be integers."}), 400

        with otel.tracer.start_as_current_span("kanban.task.move") as span:
            span.set_attribute("kanban.task.id", task_id)
            span.set_attribute("kanban.target_column.id", target_column_id)
            try:
                moved = db.move_task(
                    task_id,
                    target_column_id=target_column_id,
                    target_position=target_position,
                    db_path=_db_path(),
                )
            except LookupError as exc:
                span.set_status(StatusCode.ERROR, str(exc))
                return jsonify({"error": str(exc)}), 404

            if not moved:
                return jsonify({"error": "Task not found."}), 404

            otel.tasks_moved.add(1, {"target_column_id": str(target_column_id)})
            otel.logger.info(
                "Moved task #%s to column_id=%s pos=%s",
                task_id,
                target_column_id,
                moved["position"],
                extra={"task_id": task_id, "column_id": target_column_id},
            )
            return jsonify(moved)

    @app.delete("/api/tasks/<int:task_id>")
    def api_delete_task(task_id: int):
        with otel.tracer.start_as_current_span("kanban.task.delete") as span:
            span.set_attribute("kanban.task.id", task_id)
            if not db.delete_task(task_id, db_path=_db_path()):
                return jsonify({"error": "Task not found."}), 404
            otel.tasks_deleted.add(1)
            otel.logger.info("Deleted task #%s", task_id, extra={"task_id": task_id})
            return jsonify({"deleted": True, "id": task_id})

    # ------------------------------------------------------------------
    # Archive Endpoints
    # ------------------------------------------------------------------

    @app.get("/api/archive")
    def api_list_archive():
        query = request.args.get("q")
        tasks = db.list_archived_tasks(query=query, db_path=_db_path())
        return jsonify({"tasks": tasks, "count": len(tasks)})

    @app.post("/api/tasks/<int:task_id>/archive")
    def api_archive_task(task_id: int):
        with otel.tracer.start_as_current_span("kanban.task.archive") as span:
            span.set_attribute("kanban.task.id", task_id)
            try:
                archived = db.archive_task(task_id, db_path=_db_path())
            except ValueError as exc:
                span.set_status(StatusCode.ERROR, str(exc))
                return jsonify({"error": str(exc)}), 400
            if not archived:
                return jsonify({"error": "Task not found."}), 404
            otel.tasks_archived.add(1)
            otel.logger.info("Archived task #%s", task_id, extra={"task_id": task_id})
            return jsonify(archived)

    @app.post("/api/archive/done")
    def api_archive_done_tasks():
        with otel.tracer.start_as_current_span("kanban.archive.done") as span:
            archived = db.archive_done_tasks(db_path=_db_path())
            count = len(archived)
            span.set_attribute("kanban.archived.batch_count", count)
            if count > 0:
                otel.tasks_archived.add(count)
                otel.logger.info(
                    "Bulk-archived %s Done tasks", count, extra={"archived_count": count}
                )
            return jsonify({"archived_count": count, "tasks": archived})

    @app.post("/api/tasks/<int:task_id>/restore")
    def api_restore_task(task_id: int):
        payload: dict[str, Any] = request.get_json(silent=True) or {}
        raw_col = payload.get("column_id")
        target_col = None
        if raw_col is not None:
            try:
                target_col = int(raw_col)
            except (TypeError, ValueError):
                return jsonify({"error": "column_id must be an integer."}), 400

        with otel.tracer.start_as_current_span("kanban.task.restore") as span:
            span.set_attribute("kanban.task.id", task_id)
            try:
                restored = db.restore_task(task_id, target_column_id=target_col, db_path=_db_path())
            except LookupError as exc:
                span.set_status(StatusCode.ERROR, str(exc))
                return jsonify({"error": str(exc)}), 404
            if not restored:
                return jsonify({"error": "Task not found."}), 404
            otel.tasks_restored.add(1)
            otel.logger.info("Restored archived task #%s", task_id, extra={"task_id": task_id})
            return jsonify(restored)

    return app


app = create_app()


if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host=host, port=port, debug=debug)
