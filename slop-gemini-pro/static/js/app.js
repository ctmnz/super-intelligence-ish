/**
 * KanbanFlow — Studio-Polished Frontend Controller
 * Clean board CRUD, ghost-slot drag-and-drop, smooth theme crossfade,
 * and interactive hover/pin dependency spotlight with resolved-blocker awareness.
 */

(() => {
    "use strict";

    // -------------------------------------------------------------------------
    // Icons
    // -------------------------------------------------------------------------

    const ICONS = {
        plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        left: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
        right: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
        trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>`,
        archive: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5" rx="1"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>`,
        restore: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`,
        link: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
        blocked: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="10" y1="9" x2="10" y2="15"></line><line x1="14" y1="9" x2="14" y2="15"></line></svg>`,
        blocker: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
        check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        checklist: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
        shieldCheck: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>`,
        alert: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
        calendar: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
        moon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
        sun: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    };

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    const state = {
        columns: [],
        archivedTasks: [],
        archivedCount: 0,
        archiveQuery: "",
        filters: {
            query: "",
            cardType: "all",
            priority: "all",
        },
        quickAddColumnId: null,
        draggingTaskId: null,
        activeSpotlightTaskId: null,
        pinnedSpotlightTaskId: null,
        recentlyCreatedTaskId: null,
        modalSelectedDepIds: new Set(),
        depSearchQuery: "",
        modalAcItems: [],
        modalDodItems: [],
        modalInitialSnapshot: null,
        isSavingTask: false,
        lastFocusedElement: null,
    };

    // -------------------------------------------------------------------------
    // DOM References
    // -------------------------------------------------------------------------

    const dom = {
        boardContainer: document.getElementById("boardContainer"),
        boardStage: document.getElementById("boardStage"),
        boardGrid: document.getElementById("boardGrid"),
        dependencyLines: document.getElementById("dependencyLines"),

        depBanner: document.getElementById("depBanner"),
        depBannerDot: document.getElementById("depBannerDot"),
        depBannerText: document.getElementById("depBannerText"),
        depBannerClear: document.getElementById("depBannerClear"),

        searchInput: document.getElementById("searchInput"),
        searchKbd: document.getElementById("searchKbd"),
        clearSearchBtn: document.getElementById("clearSearchBtn"),
        cardTypeFilters: document.getElementById("cardTypeFilters"),
        priorityFilter: document.getElementById("priorityFilter"),
        resetFiltersBtn: document.getElementById("resetFiltersBtn"),

        openArchiveBtn: document.getElementById("openArchiveBtn"),
        archiveCountBadge: document.getElementById("archiveCountBadge"),
        themeToggleBtn: document.getElementById("themeToggleBtn"),
        newTaskBtn: document.getElementById("newTaskBtn"),

        taskModalOverlay: document.getElementById("taskModalOverlay"),
        taskModalDialog: document.getElementById("taskModalDialog"),
        modalScroll: document.getElementById("modalScroll"),
        taskModalTitle: document.getElementById("taskModalTitle"),
        taskModalModeBadge: document.getElementById("taskModalModeBadge"),
        taskModalTimestamp: document.getElementById("taskModalTimestamp"),
        modalDirtyPill: document.getElementById("modalDirtyPill"),
        closeTaskModalBtn: document.getElementById("closeTaskModalBtn"),
        cancelTaskModalBtn: document.getElementById("cancelTaskModalBtn"),
        saveTaskBtn: document.getElementById("saveTaskBtn"),
        saveTaskBtnLabel: document.getElementById("saveTaskBtnLabel"),
        modalDeleteBtn: document.getElementById("modalDeleteBtn"),
        modalArchiveBtn: document.getElementById("modalArchiveBtn"),
        taskForm: document.getElementById("taskForm"),
        taskIdInput: document.getElementById("taskIdInput"),
        taskTitleInput: document.getElementById("taskTitleInput"),
        taskTitleError: document.getElementById("taskTitleError"),
        titleCharCounter: document.getElementById("titleCharCounter"),
        taskDescInput: document.getElementById("taskDescInput"),
        taskAcInput: document.getElementById("taskAcInput"),
        taskDodInput: document.getElementById("taskDodInput"),
        acList: document.getElementById("acList"),
        acAddInput: document.getElementById("acAddInput"),
        acAddBtn: document.getElementById("acAddBtn"),
        acCounter: document.getElementById("acCounter"),
        acProgressTrack: document.getElementById("acProgressTrack"),
        acProgressFill: document.getElementById("acProgressFill"),
        dodList: document.getElementById("dodList"),
        dodAddInput: document.getElementById("dodAddInput"),
        dodAddBtn: document.getElementById("dodAddBtn"),
        dodPresetBtn: document.getElementById("dodPresetBtn"),
        dodCounter: document.getElementById("dodCounter"),
        dodProgressTrack: document.getElementById("dodProgressTrack"),
        dodProgressFill: document.getElementById("dodProgressFill"),
        taskCardTypeInput: document.getElementById("taskCardTypeInput"),
        cardTypeSegmented: document.getElementById("cardTypeSegmented"),
        depPickerGroup: document.getElementById("depPickerGroup"),
        depPickerLabel: document.getElementById("depPickerLabel"),
        depSelectedCount: document.getElementById("depSelectedCount"),
        depSelectedChips: document.getElementById("depSelectedChips"),
        depPickerHint: document.getElementById("depPickerHint"),
        depPickerSearch: document.getElementById("depPickerSearch"),
        depPickerList: document.getElementById("depPickerList"),
        modalColumnDot: document.getElementById("modalColumnDot"),
        modalPriorityDot: document.getElementById("modalPriorityDot"),
        taskColumnInput: document.getElementById("taskColumnInput"),
        taskPriorityInput: document.getElementById("taskPriorityInput"),
        taskDueDateInput: document.getElementById("taskDueDateInput"),
        dueTodayBtn: document.getElementById("dueTodayBtn"),
        clearDueDateBtn: document.getElementById("clearDueDateBtn"),

        archiveDrawerOverlay: document.getElementById("archiveDrawerOverlay"),
        archiveDrawerCount: document.getElementById("archiveDrawerCount"),
        closeArchiveBtn: document.getElementById("closeArchiveBtn"),
        archiveSearchInput: document.getElementById("archiveSearchInput"),
        archiveList: document.getElementById("archiveList"),

        toastContainer: document.getElementById("toastContainer"),
    };

    // -------------------------------------------------------------------------
    // API Helpers
    // -------------------------------------------------------------------------

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            headers: { "Content-Type": "application/json", ...(options.headers || {}) },
            ...options,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || `Request failed (${response.status})`);
        }
        return data;
    }

    async function refreshBoard() {
        const data = await apiRequest("/api/board");
        state.columns = data.columns;
        if (typeof data.archived_count === "number") {
            state.archivedCount = data.archived_count;
            syncArchiveBadge();
        }
        renderBoard();
    }

    function syncArchiveBadge() {
        dom.archiveCountBadge.textContent = String(state.archivedCount);
        dom.archiveCountBadge.hidden = state.archivedCount === 0;
        dom.archiveDrawerCount.textContent = String(state.archivedCount);
    }

    // -------------------------------------------------------------------------
    // Data Helpers
    // -------------------------------------------------------------------------

    function getAllTasks() {
        return state.columns.flatMap((col) => col.tasks);
    }

    function findTask(taskId) {
        for (const col of state.columns) {
            const found = col.tasks.find((t) => t.id === taskId);
            if (found) return found;
        }
        return null;
    }

    function getColumnById(columnId) {
        return state.columns.find((c) => c.id === columnId) || null;
    }

    function isTaskInDone(task) {
        return getColumnById(task.column_id)?.slug === "done";
    }

    function matchesFilters(task) {
        const { query, cardType, priority } = state.filters;
        const type = task.card_type || "task";
        if (cardType !== "all" && type !== cardType) return false;
        if (priority !== "all" && task.priority !== priority) return false;
        if (query) {
            const q = query.toLowerCase();
            const haystack = `${task.title} ${task.description || ""} ${task.acceptance_criteria || ""} ${task.definition_of_done || ""}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        return true;
    }

    function formatDueDate(dueDate, isDone) {
        if (!dueDate) return null;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [y, m, d] = dueDate.split("-").map(Number);
        const target = new Date(y, m - 1, d);
        const diffDays = Math.round((target - today) / 86400000);
        const short = target.toLocaleDateString(undefined, { month: "short", day: "numeric" });

        if (diffDays === 0) return { text: "Today", overdue: false };
        if (diffDays === 1) return { text: "Tomorrow", overdue: false };
        if (diffDays < 0 && !isDone) return { text: `Overdue · ${short}`, overdue: true };
        return { text: short, overdue: false };
    }

    function appendHighlightedText(container, text, query) {
        if (!query) {
            container.textContent = text;
            return;
        }
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const parts = text.split(new RegExp(`(${escaped})`, "gi"));
        parts.forEach((part, idx) => {
            if (idx % 2 === 1) {
                const mark = document.createElement("mark");
                mark.textContent = part;
                container.appendChild(mark);
            } else if (part) {
                container.appendChild(document.createTextNode(part));
            }
        });
    }

    function showToast(message, { type = "info", actionLabel = null, onAction = null, duration = 3000 } = {}) {
        // Keep stack clean (max 3 toasts)
        while (dom.toastContainer.children.length >= 3) {
            dom.toastContainer.firstElementChild.remove();
        }

        const toast = document.createElement("div");
        toast.className = `toast${type === "error" ? " toast--error" : ""}`;

        const iconSpan = document.createElement("span");
        iconSpan.className = "toast-icon";
        iconSpan.innerHTML = type === "error" ? ICONS.alert : ICONS.check;

        const textSpan = document.createElement("span");
        textSpan.textContent = message;
        toast.append(iconSpan, textSpan);

        let timerId = null;
        if (actionLabel && typeof onAction === "function") {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "toast-action";
            btn.textContent = actionLabel;
            btn.addEventListener("click", () => {
                if (timerId) clearTimeout(timerId);
                toast.remove();
                onAction();
            });
            toast.appendChild(btn);
        }

        dom.toastContainer.appendChild(toast);
        timerId = setTimeout(() => toast.remove(), duration);
    }

    // -------------------------------------------------------------------------
    // Dependency Hover / Pin Spotlight + Curved SVG Connectors
    // -------------------------------------------------------------------------

    function clearDependencyHighlight({ keepPinned = false } = {}) {
        if (keepPinned && state.pinnedSpotlightTaskId !== null) {
            highlightDependencies(state.pinnedSpotlightTaskId, { isPinned: true });
            return;
        }
        state.activeSpotlightTaskId = null;
        state.pinnedSpotlightTaskId = null;
        dom.boardStage.classList.remove("has-dep-highlight");
        dom.dependencyLines.innerHTML = "";
        dom.depBanner.hidden = true;
        dom.boardGrid.querySelectorAll(".task-card").forEach((card) => {
            card.classList.remove(
                "is-dimmed",
                "is-hover-source",
                "is-highlight-blocker",
                "is-highlight-blocked",
                "is-highlight-resolved"
            );
            card.querySelectorAll(".dep-callout").forEach((el) => el.remove());
        });
    }

    function highlightDependencies(taskId, { isPinned = false } = {}) {
        if (state.draggingTaskId !== null) return;
        const task = findTask(taskId);
        if (!task) return;

        const cardType = task.card_type || "task";
        const blockerIds = task.blocker_ids || [];
        const blockingIds = task.blocking_ids || [];

        let relatedIds = [];
        let mode = null; // "show-blockers" | "show-blocked"

        if (cardType === "blocked" && blockerIds.length > 0) {
            relatedIds = blockerIds;
            mode = "show-blockers";
        } else if (cardType === "blocker" && blockingIds.length > 0) {
            relatedIds = blockingIds;
            mode = "show-blocked";
        } else {
            return;
        }

        // Reset visuals before applying new spotlight
        dom.boardStage.classList.remove("has-dep-highlight");
        dom.dependencyLines.innerHTML = "";
        dom.boardGrid.querySelectorAll(".task-card").forEach((card) => {
            card.classList.remove(
                "is-dimmed",
                "is-hover-source",
                "is-highlight-blocker",
                "is-highlight-blocked",
                "is-highlight-resolved"
            );
            card.querySelectorAll(".dep-callout").forEach((el) => el.remove());
        });

        const sourceCard = dom.boardGrid.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (!sourceCard) return;

        const targetEntries = relatedIds
            .map((id) => ({
                id,
                task: findTask(id),
                el: dom.boardGrid.querySelector(`.task-card[data-task-id="${id}"]`),
            }))
            .filter((entry) => entry.el && entry.task);

        if (targetEntries.length === 0) return;

        state.activeSpotlightTaskId = taskId;
        if (isPinned) state.pinnedSpotlightTaskId = taskId;

        const relatedSet = new Set([taskId, ...relatedIds]);
        dom.boardStage.classList.add("has-dep-highlight");

        dom.boardGrid.querySelectorAll(".task-card").forEach((card) => {
            const id = Number(card.dataset.taskId);
            if (!relatedSet.has(id)) {
                card.classList.add("is-dimmed");
            }
        });

        sourceCard.classList.add("is-hover-source");

        targetEntries.forEach(({ task: targetTask, el: targetCard }) => {
            const callout = document.createElement("span");
            if (mode === "show-blockers") {
                const resolved = isTaskInDone(targetTask);
                targetCard.classList.add(resolved ? "is-highlight-resolved" : "is-highlight-blocker");
                callout.className = `dep-callout ${resolved ? "dep-callout--resolved" : "dep-callout--blocker"}`;
                callout.textContent = resolved ? "Resolved" : "Blocker";
            } else {
                targetCard.classList.add("is-highlight-blocked");
                callout.className = "dep-callout dep-callout--blocked";
                callout.textContent = "Blocked by this";
            }
            targetCard.appendChild(callout);
        });

        drawDependencyConnectors(sourceCard, targetEntries, mode);
        updateSpotlightBanner(task, targetEntries, mode, isPinned);
    }

    function updateSpotlightBanner(task, targetEntries, mode, isPinned) {
        const count = targetEntries.length;
        if (mode === "show-blockers") {
            const openCount = targetEntries.filter((e) => !isTaskInDone(e.task)).length;
            dom.depBannerDot.style.backgroundColor =
                openCount > 0 ? "var(--blocker-color)" : "var(--resolved-color)";
            dom.depBannerText.textContent =
                openCount === 0
                    ? `All ${count} blocker${count > 1 ? "s" : ""} resolved for "${task.title}"`
                    : `${openCount} active blocker${openCount > 1 ? "s" : ""} for "${task.title}"`;
        } else {
            dom.depBannerDot.style.backgroundColor = "var(--blocked-color)";
            dom.depBannerText.textContent = `"${task.title}" blocks ${count} card${count > 1 ? "s" : ""}`;
        }
        dom.depBannerClear.hidden = !isPinned;
        dom.depBanner.hidden = false;
    }

    function drawDependencyConnectors(sourceCard, targetEntries, mode) {
        dom.dependencyLines.innerHTML = "";
        const stageRect = dom.boardStage.getBoundingClientRect();
        const svgNS = "http://www.w3.org/2000/svg";

        const getAnchor = (fromRect, toRect) => {
            const fromCx = fromRect.left + fromRect.width / 2 - stageRect.left;
            const fromCy = fromRect.top + fromRect.height / 2 - stageRect.top;
            const toCx = toRect.left + toRect.width / 2 - stageRect.left;
            const toCy = toRect.top + toRect.height / 2 - stageRect.top;

            const dx = toCx - fromCx;
            const dy = toCy - fromCy;

            if (Math.abs(dx) > 40) {
                const startX = dx > 0 ? fromRect.right - stageRect.left : fromRect.left - stageRect.left;
                const endX = dx > 0 ? toRect.left - stageRect.left : toRect.right - stageRect.left;
                const curve = Math.max(52, Math.abs(endX - startX) * 0.42);
                const c1x = dx > 0 ? startX + curve : startX - curve;
                const c2x = dx > 0 ? endX - curve : endX + curve;
                return {
                    d: `M ${startX} ${fromCy} C ${c1x} ${fromCy}, ${c2x} ${toCy}, ${endX} ${toCy}`,
                    sx: startX,
                    sy: fromCy,
                };
            }

            const sideX = Math.max(fromRect.right, toRect.right) - stageRect.left;
            const startY = dy > 0 ? fromRect.bottom - stageRect.top - 14 : fromRect.top - stageRect.top + 14;
            const endY = dy > 0 ? toRect.top - stageRect.top + 14 : toRect.bottom - stageRect.top - 14;
            const bulge = Math.min(64, Math.max(34, Math.abs(endY - startY) * 0.3));
            return {
                d: `M ${sideX} ${startY} C ${sideX + bulge} ${startY}, ${sideX + bulge} ${endY}, ${sideX} ${endY}`,
                sx: sideX,
                sy: startY,
            };
        };

        const srcRect = sourceCard.getBoundingClientRect();

        targetEntries.forEach(({ task: targetTask, el: targetCard }) => {
            const tgtRect = targetCard.getBoundingClientRect();
            const fromRect = mode === "show-blockers" ? tgtRect : srcRect;
            const toRect = mode === "show-blockers" ? srcRect : tgtRect;
            const { d, sx, sy } = getAnchor(fromRect, toRect);

            const tone =
                mode === "show-blockers"
                    ? isTaskInDone(targetTask)
                        ? "resolved"
                        : "blocker"
                    : "blocked";

            const markerId =
                tone === "blocker" ? "url(#arrow-red)" : tone === "resolved" ? "url(#arrow-green)" : "url(#arrow-amber)";
            const fillVar =
                tone === "blocker"
                    ? "var(--blocker-color)"
                    : tone === "resolved"
                    ? "var(--resolved-color)"
                    : "var(--blocked-color)";

            // Soft under-glow path
            const glow = document.createElementNS(svgNS, "path");
            glow.setAttribute("d", d);
            glow.setAttribute("class", `dep-path-glow dep-path-glow--${tone}`);
            dom.dependencyLines.appendChild(glow);

            // Crisp animated arrow path
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", d);
            path.setAttribute("class", `dep-path dep-path--${tone}`);
            path.setAttribute("marker-end", markerId);
            dom.dependencyLines.appendChild(path);

            // Origin dot
            const dot = document.createElementNS(svgNS, "circle");
            dot.setAttribute("cx", String(sx));
            dot.setAttribute("cy", String(sy));
            dot.setAttribute("r", "4");
            dot.setAttribute("class", "dep-node");
            dot.setAttribute("fill", fillVar);
            dom.dependencyLines.appendChild(dot);
        });
    }

    // -------------------------------------------------------------------------
    // Board Rendering
    // -------------------------------------------------------------------------

    function renderBoard() {
        const prevPinned = state.pinnedSpotlightTaskId;
        clearDependencyHighlight();
        dom.boardGrid.innerHTML = "";
        const totalColumns = state.columns.length;

        state.columns.forEach((column, colIndex) => {
            const visibleTasks = column.tasks.filter(matchesFilters);

            const colEl = document.createElement("section");
            colEl.className = "kanban-column";
            colEl.dataset.columnId = String(column.id);
            colEl.dataset.columnSlug = column.slug;
            colEl.setAttribute("aria-label", `${column.name} column`);

            // Header
            const header = document.createElement("header");
            header.className = "column-header";

            const titleGroup = document.createElement("div");
            titleGroup.className = "column-title-group";

            const dot = document.createElement("span");
            dot.className = "column-dot";
            dot.style.backgroundColor = column.color;
            dot.setAttribute("aria-hidden", "true");

            const title = document.createElement("h2");
            title.className = "column-title";
            title.textContent = column.name;

            const count = document.createElement("span");
            count.className = "column-count";
            count.textContent =
                visibleTasks.length === column.tasks.length
                    ? String(column.tasks.length)
                    : `${visibleTasks.length}/${column.tasks.length}`;

            titleGroup.append(dot, title, count);

            const headerActions = document.createElement("div");
            headerActions.className = "column-header-actions";

            if (column.slug === "done" && column.tasks.length > 0) {
                const archiveAllBtn = document.createElement("button");
                archiveAllBtn.type = "button";
                archiveAllBtn.className = "column-archive-all-btn";
                archiveAllBtn.dataset.action = "archive-all-done";
                archiveAllBtn.title = "Archive all completed cards";
                archiveAllBtn.textContent = "Archive all";
                headerActions.appendChild(archiveAllBtn);
            }

            const addBtn = document.createElement("button");
            addBtn.type = "button";
            addBtn.className = "icon-btn column-add-btn";
            addBtn.dataset.addColumnId = String(column.id);
            addBtn.title = `New card in ${column.name}`;
            addBtn.setAttribute("aria-label", `New card in ${column.name}`);
            addBtn.innerHTML = ICONS.plus;
            headerActions.appendChild(addBtn);

            header.append(titleGroup, headerActions);

            // Cards
            const listEl = document.createElement("div");
            listEl.className = "task-list";
            listEl.dataset.columnId = String(column.id);
            listEl.setAttribute("role", "list");

            if (visibleTasks.length === 0) {
                const empty = document.createElement("button");
                empty.type = "button";
                empty.className = "empty-column";
                empty.textContent = hasActiveFilters()
                    ? "No matching cards"
                    : "Drop a card or click to add";
                if (!hasActiveFilters()) {
                    empty.dataset.quickAddCol = String(column.id);
                }
                listEl.appendChild(empty);
            } else {
                visibleTasks.forEach((task) => {
                    listEl.appendChild(createTaskCard(task, colIndex, totalColumns));
                });
            }

            // Quiet inline quick-add footer
            const footer = document.createElement("div");
            footer.className = "column-footer";
            if (state.quickAddColumnId === column.id) {
                footer.appendChild(createQuickAddForm(column.id));
            } else {
                const trigger = document.createElement("button");
                trigger.type = "button";
                trigger.className = "quick-add-trigger";
                trigger.dataset.quickAddCol = String(column.id);
                trigger.innerHTML = `${ICONS.plus}<span>Add card</span>`;
                footer.appendChild(trigger);
            }

            attachDropHandlers(colEl, listEl, column.id);
            colEl.append(header, listEl, footer);
            dom.boardGrid.appendChild(colEl);
        });

        if (state.quickAddColumnId !== null) {
            const input = dom.boardGrid.querySelector(".quick-add-input");
            if (input) input.focus();
        }

        if (state.recentlyCreatedTaskId !== null) {
            const justId = state.recentlyCreatedTaskId;
            state.recentlyCreatedTaskId = null;
            const el = dom.boardGrid.querySelector(`.task-card[data-task-id="${justId}"]`);
            if (el) el.classList.add("is-just-created");
        }

        if (prevPinned !== null && findTask(prevPinned)) {
            highlightDependencies(prevPinned, { isPinned: true });
        }

        updateFilterControls();
    }

    function createQuickAddForm(columnId) {
        const form = document.createElement("form");
        form.className = "quick-add-form";

        const input = document.createElement("input");
        input.type = "text";
        input.className = "quick-add-input";
        input.placeholder = "Card title...";
        input.maxLength = 160;
        input.autocomplete = "off";

        const actions = document.createElement("div");
        actions.className = "quick-add-actions";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn-ghost btn-sm";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => {
            state.quickAddColumnId = null;
            renderBoard();
        });

        const addBtn = document.createElement("button");
        addBtn.type = "submit";
        addBtn.className = "btn btn-primary btn-sm";
        addBtn.textContent = "Add";

        actions.append(cancelBtn, addBtn);
        form.append(input, actions);

        input.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                state.quickAddColumnId = null;
                renderBoard();
            }
        });

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const title = input.value.trim();
            if (!title) {
                input.focus();
                return;
            }
            addBtn.disabled = true;
            try {
                const created = await apiRequest("/api/tasks", {
                    method: "POST",
                    body: JSON.stringify({
                        title,
                        column_id: columnId,
                        priority: state.filters.priority !== "all" ? state.filters.priority : "medium",
                        card_type: state.filters.cardType !== "all" ? state.filters.cardType : "task",
                    }),
                });
                state.recentlyCreatedTaskId = created.id;
                await refreshBoard();
                showToast("Card added");
            } catch (err) {
                showToast(err.message, { type: "error" });
                addBtn.disabled = false;
            }
        });

        return form;
    }

    function parseChecklist(text) {
        if (!text) return [];
        return text
            .split(/\r?\n/)
            .map((raw) => raw.trim())
            .filter(Boolean)
            .map((line) => {
                const checkedMatch = line.match(/^(?:-\s*)?\[([xX])\]\s*(.*)$/);
                if (checkedMatch) {
                    return { text: checkedMatch[2].trim(), done: true };
                }
                const uncheckedMatch = line.match(/^(?:-\s*)?\[\s\]\s*(.*)$/);
                if (uncheckedMatch) {
                    return { text: uncheckedMatch[1].trim(), done: false };
                }
                return { text: line, done: false };
            })
            .filter((item) => item.text.length > 0);
    }

    function serializeChecklist(items) {
        return items
            .map((item) => {
                const clean = item.text.trim();
                if (!clean) return "";
                return item.done ? `[x] ${clean}` : clean;
            })
            .filter(Boolean)
            .join("\n");
    }

    function createCriteriaPills(task) {
        const acItems = parseChecklist(task.acceptance_criteria);
        const dodItems = parseChecklist(task.definition_of_done);
        if (acItems.length === 0 && dodItems.length === 0) return null;

        const row = document.createElement("div");
        row.className = "task-criteria-row";

        if (acItems.length > 0) {
            const acDone = acItems.filter((i) => i.done).length;
            const ac = document.createElement("span");
            ac.className = `criteria-pill${acDone === acItems.length ? " criteria-pill--dod" : ""}`;
            ac.title = `Acceptance Criteria:\n${acItems
                .map((i) => `${i.done ? "✓" : "○"} ${i.text}`)
                .join("\n")}`;
            const label = acDone > 0 ? `AC · ${acDone}/${acItems.length}` : `AC · ${acItems.length}`;
            ac.innerHTML = `${ICONS.checklist}<span>${label}</span>`;
            row.appendChild(ac);
        }

        if (dodItems.length > 0) {
            const dodDone = dodItems.filter((i) => i.done).length;
            const dod = document.createElement("span");
            dod.className = "criteria-pill criteria-pill--dod";
            dod.title = `Definition of Done:\n${dodItems
                .map((i) => `${i.done ? "✓" : "○"} ${i.text}`)
                .join("\n")}`;
            const label =
                dodDone > 0 ? `DoD · ${dodDone}/${dodItems.length}` : `DoD · ${dodItems.length}`;
            dod.innerHTML = `${ICONS.shieldCheck}<span>${label}</span>`;
            row.appendChild(dod);
        }

        return row;
    }

    function createTaskCard(task, colIndex, totalColumns) {
        const cardType = task.card_type || "task";
        const blockerIds = task.blocker_ids || [];
        const blockingIds = task.blocking_ids || [];

        const card = document.createElement("article");
        card.className = `task-card${cardType !== "task" ? ` task-card--${cardType}` : ""}`;
        card.draggable = true;
        card.tabIndex = 0;
        card.dataset.taskId = String(task.id);
        card.dataset.columnId = String(task.column_id);
        card.dataset.priority = task.priority;
        card.dataset.cardType = cardType;
        card.setAttribute("role", "listitem");

        // Top row
        const top = document.createElement("div");
        top.className = "task-top";

        const badges = document.createElement("div");
        badges.className = "task-badges";

        if (cardType === "blocked") {
            const pill = document.createElement("span");
            pill.className = "type-pill type-pill--blocked";
            pill.innerHTML = `${ICONS.blocked}<span>Blocked</span>`;
            badges.appendChild(pill);
        } else if (cardType === "blocker") {
            const pill = document.createElement("span");
            pill.className = "type-pill type-pill--blocker";
            pill.innerHTML = `${ICONS.blocker}<span>Blocker</span>`;
            badges.appendChild(pill);
        }

        const pri = document.createElement("span");
        pri.className = "priority-label";
        pri.innerHTML = `<span class="priority-dot priority-dot--${task.priority}"></span>${task.priority}`;
        badges.appendChild(pri);

        const hoverActions = document.createElement("div");
        hoverActions.className = "task-hover-actions";

        const prevBtn = document.createElement("button");
        prevBtn.type = "button";
        prevBtn.className = "card-mini-btn";
        prevBtn.dataset.action = "move-prev";
        prevBtn.disabled = colIndex <= 0;
        prevBtn.title = colIndex > 0 ? `Move to ${state.columns[colIndex - 1].name}` : "First column";
        prevBtn.setAttribute("aria-label", prevBtn.title);
        prevBtn.innerHTML = ICONS.left;

        const nextBtn = document.createElement("button");
        nextBtn.type = "button";
        nextBtn.className = "card-mini-btn";
        nextBtn.dataset.action = "move-next";
        nextBtn.disabled = colIndex >= totalColumns - 1;
        nextBtn.title =
            colIndex < totalColumns - 1 ? `Move to ${state.columns[colIndex + 1].name}` : "Last column";
        nextBtn.setAttribute("aria-label", nextBtn.title);
        nextBtn.innerHTML = ICONS.right;

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "card-mini-btn card-mini-btn--danger";
        delBtn.dataset.action = "delete";
        delBtn.title = "Delete card";
        delBtn.setAttribute("aria-label", `Delete ${task.title}`);
        delBtn.innerHTML = ICONS.trash;

        const isDoneColumn = state.columns[colIndex]?.slug === "done";
        if (isDoneColumn) {
            const archiveBtn = document.createElement("button");
            archiveBtn.type = "button";
            archiveBtn.className = "card-mini-btn";
            archiveBtn.dataset.action = "archive";
            archiveBtn.title = "Archive card";
            archiveBtn.setAttribute("aria-label", `Archive ${task.title}`);
            archiveBtn.innerHTML = ICONS.archive;
            hoverActions.append(prevBtn, archiveBtn, delBtn);
        } else {
            hoverActions.append(prevBtn, nextBtn, delBtn);
        }
        top.append(badges, hoverActions);

        // Title
        const titleEl = document.createElement("h3");
        titleEl.className = "task-title";
        appendHighlightedText(titleEl, task.title, state.filters.query);

        card.append(top, titleEl);

        // Optional description
        if (task.description) {
            const descEl = document.createElement("p");
            descEl.className = "task-desc";
            appendHighlightedText(descEl, task.description, state.filters.query);
            card.appendChild(descEl);
        }

        // Compact Acceptance Criteria & Definition of Done indicators
        const criteriaRow = createCriteriaPills(task);
        if (criteriaRow) {
            card.appendChild(criteriaRow);
        }

        // Minimal Footer
        const isDoneCol = state.columns[colIndex]?.slug === "done";
        const dueInfo = formatDueDate(task.due_date, isDoneCol);
        const hasDeps =
            (cardType === "blocked" && blockerIds.length > 0) ||
            (cardType === "blocker" && blockingIds.length > 0);
        const showLinkPrompt =
            (cardType === "blocked" && blockerIds.length === 0) ||
            (cardType === "blocker" && blockingIds.length === 0);

        if (hasDeps || showLinkPrompt || dueInfo) {
            const footer = document.createElement("div");
            footer.className = "task-footer";

            if (hasDeps) {
                const depBtn = document.createElement("button");
                depBtn.type = "button";
                depBtn.dataset.action = "pin-dep";

                if (cardType === "blocked") {
                    const linkedBlockers = blockerIds.map((id) => findTask(id)).filter(Boolean);
                    const openBlockers = linkedBlockers.filter((b) => !isTaskInDone(b));
                    const allResolved = linkedBlockers.length > 0 && openBlockers.length === 0;

                    depBtn.className = `dep-summary-btn ${
                        allResolved ? "dep-summary-btn--resolved" : "dep-summary-btn--blocked"
                    }`;
                    depBtn.innerHTML = allResolved
                        ? `${ICONS.check}<span>Blockers resolved</span>`
                        : `${ICONS.link}<span>Blocked by ${openBlockers.length}${
                              openBlockers.length !== linkedBlockers.length
                                  ? `/${linkedBlockers.length}`
                                  : ""
                          }</span>`;
                    depBtn.title = `Click to pin · Blocked by: ${linkedBlockers
                        .map((b) => b.title)
                        .join(", ")}`;
                } else {
                    const linkedBlocked = blockingIds.map((id) => findTask(id)).filter(Boolean);
                    depBtn.className = "dep-summary-btn dep-summary-btn--blocker";
                    depBtn.innerHTML = `${ICONS.link}<span>Blocks ${blockingIds.length}</span>`;
                    depBtn.title = `Click to pin · Blocks: ${linkedBlocked
                        .map((b) => b.title)
                        .join(", ")}`;
                }
                footer.appendChild(depBtn);
            } else if (showLinkPrompt) {
                const prompt = document.createElement("span");
                prompt.className = "dep-prompt";
                prompt.textContent =
                    cardType === "blocked" ? "Click to link blockers" : "Click to link blocked cards";
                footer.appendChild(prompt);
            } else {
                footer.appendChild(document.createElement("span"));
            }

            if (dueInfo) {
                const dateEl = document.createElement("span");
                dateEl.className = `task-date${dueInfo.overdue ? " is-overdue" : ""}`;
                dateEl.innerHTML = `${ICONS.calendar}<span></span>`;
                dateEl.querySelector("span").textContent = dueInfo.text;
                footer.appendChild(dateEl);
            }

            card.appendChild(footer);
        }

        // Hover & Focus Dependency Highlighting
        if (cardType === "blocked" || cardType === "blocker") {
            card.addEventListener("mouseenter", () => {
                if (state.pinnedSpotlightTaskId === null) {
                    highlightDependencies(task.id);
                }
            });
            card.addEventListener("mouseleave", () => {
                clearDependencyHighlight({ keepPinned: true });
            });
            card.addEventListener("focus", () => {
                if (state.pinnedSpotlightTaskId === null) {
                    highlightDependencies(task.id);
                }
            });
            card.addEventListener("blur", () => {
                clearDependencyHighlight({ keepPinned: true });
            });
        }

        // Drag-and-drop
        card.addEventListener("dragstart", (event) => {
            clearDependencyHighlight();
            state.draggingTaskId = task.id;
            card.classList.add("is-dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(task.id));
        });

        card.addEventListener("dragend", () => {
            state.draggingTaskId = null;
            card.classList.remove("is-dragging");
            clearDropIndicators();
        });

        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && event.target === card) {
                event.preventDefault();
                openTaskModal(task);
            }
        });

        return card;
    }

    function hasActiveFilters() {
        return (
            Boolean(state.filters.query) ||
            state.filters.cardType !== "all" ||
            state.filters.priority !== "all"
        );
    }

    function updateFilterControls() {
        const hasQuery = Boolean(state.filters.query);
        dom.clearSearchBtn.hidden = !hasQuery;
        if (dom.searchKbd) dom.searchKbd.hidden = hasQuery;
        dom.resetFiltersBtn.hidden = !hasActiveFilters();

        const tasks = getAllTasks();
        const blockedCount = tasks.filter((t) => t.card_type === "blocked").length;
        const blockerCount = tasks.filter((t) => t.card_type === "blocker").length;

        const blockedBadge = dom.cardTypeFilters.querySelector('[data-chip-count="blocked"]');
        const blockerBadge = dom.cardTypeFilters.querySelector('[data-chip-count="blocker"]');
        if (blockedBadge) {
            blockedBadge.textContent = String(blockedCount);
            blockedBadge.hidden = blockedCount === 0;
        }
        if (blockerBadge) {
            blockerBadge.textContent = String(blockerCount);
            blockerBadge.hidden = blockerCount === 0;
        }
    }

    // -------------------------------------------------------------------------
    // Drag-and-Drop (Ghost Drop Slot)
    // -------------------------------------------------------------------------

    function clearDropIndicators() {
        document.querySelectorAll(".kanban-column.is-drag-over").forEach((el) => {
            el.classList.remove("is-drag-over");
        });
        document.querySelectorAll(".drop-slot").forEach((el) => el.remove());
    }

    function getDropInsertionElement(listEl, clientY) {
        const cards = [...listEl.querySelectorAll(".task-card:not(.is-dragging)")];
        let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
        for (const card of cards) {
            const rect = card.getBoundingClientRect();
            const offset = clientY - rect.top - rect.height / 2;
            if (offset < 0 && offset > closest.offset) {
                closest = { offset, element: card };
            }
        }
        return closest.element;
    }

    function attachDropHandlers(colEl, listEl, columnId) {
        colEl.addEventListener("dragover", (event) => {
            if (state.draggingTaskId === null) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";

            const afterEl = getDropInsertionElement(listEl, event.clientY);
            const existingSlot = listEl.querySelector(".drop-slot");

            // Avoid thrashing DOM if drop slot is already in the exact right position
            if (
                colEl.classList.contains("is-drag-over") &&
                existingSlot &&
                existingSlot.nextElementSibling === afterEl
            ) {
                return;
            }

            clearDropIndicators();
            colEl.classList.add("is-drag-over");

            const slot = document.createElement("div");
            slot.className = "drop-slot";
            if (afterEl) listEl.insertBefore(slot, afterEl);
            else listEl.appendChild(slot);
        });

        colEl.addEventListener("dragleave", (event) => {
            if (!colEl.contains(event.relatedTarget)) {
                colEl.classList.remove("is-drag-over");
                colEl.querySelectorAll(".drop-slot").forEach((el) => el.remove());
            }
        });

        colEl.addEventListener("drop", async (event) => {
            event.preventDefault();
            const rawId = state.draggingTaskId ?? Number(event.dataTransfer.getData("text/plain"));
            const afterEl = getDropInsertionElement(listEl, event.clientY);
            clearDropIndicators();
            if (!rawId) return;

            const targetCol = state.columns.find((c) => c.id === columnId);
            if (!targetCol) return;

            let position = targetCol.tasks.filter((t) => t.id !== rawId).length;
            if (afterEl) {
                const afterTaskId = Number(afterEl.dataset.taskId);
                const ordered = targetCol.tasks.filter((t) => t.id !== rawId);
                const idx = ordered.findIndex((t) => t.id === afterTaskId);
                if (idx !== -1) position = idx;
            }
            await handleMoveTask(rawId, columnId, position);
        });
    }

    // -------------------------------------------------------------------------
    // Optimistic Mutations
    // -------------------------------------------------------------------------

    function applyOptimisticMove(taskId, targetColumnId, targetPosition) {
        let movedTask = null;
        for (const col of state.columns) {
            const idx = col.tasks.findIndex((t) => t.id === taskId);
            if (idx !== -1) {
                [movedTask] = col.tasks.splice(idx, 1);
                break;
            }
        }
        if (!movedTask) return;
        const targetCol = state.columns.find((c) => c.id === targetColumnId);
        if (!targetCol) return;

        movedTask.column_id = targetColumnId;
        const insertAt =
            targetPosition === null || targetPosition < 0 || targetPosition > targetCol.tasks.length
                ? targetCol.tasks.length
                : targetPosition;
        targetCol.tasks.splice(insertAt, 0, movedTask);
        renderBoard();
    }

    async function handleMoveTask(taskId, targetColumnId, targetPosition = null, toastMsg = null) {
        const snapshot = JSON.parse(JSON.stringify(state.columns));
        applyOptimisticMove(taskId, targetColumnId, targetPosition);

        try {
            await apiRequest(`/api/tasks/${taskId}/move`, {
                method: "PATCH",
                body: JSON.stringify({ column_id: targetColumnId, position: targetPosition }),
            });
            await refreshBoard();
            if (toastMsg) showToast(toastMsg);
        } catch (err) {
            state.columns = snapshot;
            renderBoard();
            showToast(err.message, { type: "error" });
        }
    }

    async function handleQuickMove(taskId, delta) {
        const task = findTask(taskId);
        if (!task) return;
        const curIdx = state.columns.findIndex((c) => c.id === task.column_id);
        const nextIdx = curIdx + delta;
        if (nextIdx < 0 || nextIdx >= state.columns.length) return;
        const targetCol = state.columns[nextIdx];
        await handleMoveTask(taskId, targetCol.id, null, `Moved to ${targetCol.name}`);
    }

    async function handleDeleteTaskWithUndo(task) {
        const backup = JSON.parse(JSON.stringify(task));
        const snapshot = JSON.parse(JSON.stringify(state.columns));

        for (const col of state.columns) {
            const idx = col.tasks.findIndex((t) => t.id === task.id);
            if (idx !== -1) {
                col.tasks.splice(idx, 1);
                break;
            }
        }
        closeTaskModal(true);
        renderBoard();

        try {
            await apiRequest(`/api/tasks/${task.id}`, { method: "DELETE" });
            await refreshBoard();
            showToast(`Deleted "${task.title}"`, {
                duration: 5000,
                actionLabel: "Undo",
                onAction: async () => {
                    try {
                        const restored = await apiRequest("/api/tasks", {
                            method: "POST",
                            body: JSON.stringify({
                                title: backup.title,
                                description: backup.description,
                                acceptance_criteria: backup.acceptance_criteria || "",
                                definition_of_done: backup.definition_of_done || "",
                                priority: backup.priority,
                                card_type: backup.card_type || "task",
                                column_id: backup.column_id,
                                due_date: backup.due_date,
                                blocker_ids: backup.card_type === "blocked" ? backup.blocker_ids : undefined,
                                blocking_ids: backup.card_type === "blocker" ? backup.blocking_ids : undefined,
                            }),
                        });
                        await apiRequest(`/api/tasks/${restored.id}/move`, {
                            method: "PATCH",
                            body: JSON.stringify({
                                column_id: backup.column_id,
                                position: backup.position,
                            }),
                        });
                        state.recentlyCreatedTaskId = restored.id;
                        await refreshBoard();
                        showToast("Card restored");
                    } catch (err) {
                        showToast(err.message, { type: "error" });
                    }
                },
            });
        } catch (err) {
            state.columns = snapshot;
            renderBoard();
            showToast(err.message, { type: "error" });
        }
    }

    // -------------------------------------------------------------------------
    // Modal: Property Chips, Interactive Checklists & Dependency Picker
    // -------------------------------------------------------------------------

    const PRIORITY_COLORS = {
        low: "var(--priority-low)",
        medium: "var(--priority-medium)",
        high: "var(--priority-high)",
        urgent: "var(--priority-urgent)",
    };

    const STANDARD_DOD_ITEMS = [
        "Tests pass cleanly",
        "Code reviewed",
        "Documentation updated",
    ];

    function getModalSnapshot() {
        return JSON.stringify({
            title: dom.taskTitleInput.value.trim(),
            description: dom.taskDescInput.value.trim(),
            column_id: dom.taskColumnInput.value,
            priority: dom.taskPriorityInput.value,
            due_date: dom.taskDueDateInput.value,
            card_type: dom.taskCardTypeInput.value,
            deps: [...state.modalSelectedDepIds].sort((a, b) => a - b),
            ac: serializeChecklist(state.modalAcItems),
            dod: serializeChecklist(state.modalDodItems),
        });
    }

    function syncDirtyState() {
        const isEdit = Boolean(dom.taskIdInput.value);
        if (!isEdit || !state.modalInitialSnapshot) {
            dom.modalDirtyPill.hidden = true;
            return;
        }
        dom.modalDirtyPill.hidden = getModalSnapshot() === state.modalInitialSnapshot;
    }

    function autoSizeDescription() {
        const el = dom.taskDescInput;
        el.style.height = "auto";
        el.style.height = `${Math.min(220, Math.max(76, el.scrollHeight))}px`;
    }

    function syncModalScrollShadows() {
        const scroller = dom.modalScroll;
        const atTop = scroller.scrollTop <= 2;
        const atBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 2;
        dom.taskModalDialog.classList.toggle("has-top-shadow", !atTop);
        dom.taskModalDialog.classList.toggle("has-bottom-shadow", !atBottom);
    }

    function syncModalPropertyDots() {
        const col = getColumnById(Number(dom.taskColumnInput.value));
        dom.modalColumnDot.style.backgroundColor = col ? col.color : "var(--text-muted)";
        dom.modalPriorityDot.style.backgroundColor =
            PRIORITY_COLORS[dom.taskPriorityInput.value] || "var(--priority-medium)";
        const hasDue = Boolean(dom.taskDueDateInput.value);
        dom.clearDueDateBtn.hidden = !hasDue;
        dom.dueTodayBtn.hidden = hasDue;
        syncDirtyState();
    }

    function syncTitleCharCounter() {
        const len = dom.taskTitleInput.value.length;
        dom.titleCharCounter.textContent = `${len}/160`;
        dom.titleCharCounter.hidden = len < 110;
    }

    function renderChecklistEditor(kind) {
        const isAc = kind === "ac";
        const items = isAc ? state.modalAcItems : state.modalDodItems;
        const listEl = isAc ? dom.acList : dom.dodList;
        const counterEl = isAc ? dom.acCounter : dom.dodCounter;
        const trackEl = isAc ? dom.acProgressTrack : dom.dodProgressTrack;
        const fillEl = isAc ? dom.acProgressFill : dom.dodProgressFill;

        listEl.innerHTML = "";
        const total = items.length;
        const doneCount = items.filter((i) => i.done).length;

        counterEl.hidden = total === 0;
        counterEl.textContent = `${doneCount}/${total}`;
        counterEl.classList.toggle("is-complete", total > 0 && doneCount === total);
        trackEl.hidden = total === 0;
        fillEl.style.width = total > 0 ? `${Math.round((doneCount / total) * 100)}%` : "0%";
        if (!isAc) {
            dom.dodPresetBtn.hidden = total > 0;
        }

        items.forEach((item, index) => {
            const li = document.createElement("li");
            li.className = `checklist-item${item.done ? " is-done" : ""}`;

            const checkBtn = document.createElement("button");
            checkBtn.type = "button";
            checkBtn.className = "check-toggle";
            checkBtn.setAttribute("role", "checkbox");
            checkBtn.setAttribute("aria-checked", String(item.done));
            checkBtn.setAttribute("aria-label", `Toggle "${item.text}"`);
            checkBtn.innerHTML = ICONS.check;
            checkBtn.addEventListener("click", () => {
                item.done = !item.done;
                renderChecklistEditor(kind);
                syncDirtyState();
            });

            const input = document.createElement("input");
            input.type = "text";
            input.className = "checklist-item-input";
            input.value = item.text;
            input.addEventListener("input", () => {
                item.text = input.value;
                syncDirtyState();
            });
            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    const nextItem = li.nextElementSibling?.querySelector(".checklist-item-input");
                    if (nextItem) nextItem.focus();
                    else (isAc ? dom.acAddInput : dom.dodAddInput).focus();
                } else if (event.key === "Backspace" && !input.value) {
                    event.preventDefault();
                    items.splice(index, 1);
                    renderChecklistEditor(kind);
                    syncDirtyState();
                }
            });

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "checklist-item-remove";
            removeBtn.title = "Remove item";
            removeBtn.setAttribute("aria-label", `Remove "${item.text}"`);
            removeBtn.innerHTML = "&times;";
            removeBtn.addEventListener("click", () => {
                items.splice(index, 1);
                renderChecklistEditor(kind);
                syncDirtyState();
            });

            li.append(checkBtn, input, removeBtn);
            listEl.appendChild(li);
        });

        requestAnimationFrame(syncModalScrollShadows);
    }

    function toggleAllChecklistItems(kind) {
        const items = kind === "ac" ? state.modalAcItems : state.modalDodItems;
        if (items.length === 0) return;
        const allDone = items.every((i) => i.done);
        items.forEach((i) => {
            i.done = !allDone;
        });
        renderChecklistEditor(kind);
        syncDirtyState();
    }

    function addChecklistItemFromInput(kind) {
        const isAc = kind === "ac";
        const input = isAc ? dom.acAddInput : dom.dodAddInput;
        const items = isAc ? state.modalAcItems : state.modalDodItems;
        const raw = input.value.trim();
        if (!raw) return;

        const parsed = parseChecklist(raw);
        parsed.forEach((entry) => items.push(entry));
        input.value = "";
        renderChecklistEditor(kind);
        syncDirtyState();
        input.focus();
    }

    function renderSelectedDepChips(cardType) {
        dom.depSelectedChips.innerHTML = "";
        const ids = [...state.modalSelectedDepIds];
        dom.depSelectedChips.hidden = ids.length === 0;
        const chipTone = cardType === "blocked" ? "blocker" : "blocked";

        ids.forEach((id) => {
            const task = findTask(id);
            if (!task) return;
            const chip = document.createElement("span");
            chip.className = `dep-chip dep-chip--${chipTone}`;

            const text = document.createElement("span");
            text.className = "dep-chip-text";
            text.textContent = task.title;

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "dep-chip-remove";
            removeBtn.title = `Unlink "${task.title}"`;
            removeBtn.setAttribute("aria-label", `Unlink ${task.title}`);
            removeBtn.innerHTML = "&times;";
            removeBtn.addEventListener("click", () => {
                state.modalSelectedDepIds.delete(id);
                const editingId = dom.taskIdInput.value ? Number(dom.taskIdInput.value) : null;
                renderDependencyPicker(cardType, editingId);
                syncDirtyState();
            });

            chip.append(text, removeBtn);
            dom.depSelectedChips.appendChild(chip);
        });
    }

    function renderDependencyPicker(cardType, editingTaskId) {
        if (cardType !== "blocked" && cardType !== "blocker") {
            dom.depPickerGroup.hidden = true;
            return;
        }

        dom.depPickerGroup.hidden = false;
        const isBlockedMode = cardType === "blocked";
        dom.depPickerLabel.textContent = isBlockedMode ? "Blocked by" : "Blocks these cards";
        dom.depPickerHint.textContent = isBlockedMode
            ? "Hovered card highlights blockers in red"
            : "Hovered card highlights blocked cards";

        const preferredType = isBlockedMode ? "blocker" : "blocked";
        const allCandidates = getAllTasks()
            .filter((t) => t.id !== editingTaskId)
            .sort((a, b) => {
                const aSel = state.modalSelectedDepIds.has(a.id) ? 0 : 1;
                const bSel = state.modalSelectedDepIds.has(b.id) ? 0 : 1;
                if (aSel !== bSel) return aSel - bSel;
                const aPref = (a.card_type || "task") === preferredType ? 0 : 1;
                const bPref = (b.card_type || "task") === preferredType ? 0 : 1;
                if (aPref !== bPref) return aPref - bPref;
                return a.title.localeCompare(b.title);
            });

        dom.depPickerSearch.hidden = allCandidates.length < 5;

        const filterQ = state.depSearchQuery.trim().toLowerCase();
        const candidates = filterQ
            ? allCandidates.filter((c) => c.title.toLowerCase().includes(filterQ))
            : allCandidates;

        const syncSelectedBadge = () => {
            const count = state.modalSelectedDepIds.size;
            dom.depSelectedCount.textContent = String(count);
            dom.depSelectedCount.hidden = count === 0;
            renderSelectedDepChips(cardType);
            syncDirtyState();
        };
        syncSelectedBadge();

        dom.depPickerList.innerHTML = "";

        if (candidates.length === 0) {
            const empty = document.createElement("div");
            empty.className = "dep-empty";
            empty.textContent =
                allCandidates.length === 0
                    ? "Create another card first to link dependencies."
                    : "No cards match your filter.";
            dom.depPickerList.appendChild(empty);
            return;
        }

        candidates.forEach((candidate) => {
            const isChecked = state.modalSelectedDepIds.has(candidate.id);
            const label = document.createElement("label");
            label.className = `dep-option${isChecked ? " is-checked" : ""}`;

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = String(candidate.id);
            checkbox.checked = isChecked;
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) state.modalSelectedDepIds.add(candidate.id);
                else state.modalSelectedDepIds.delete(candidate.id);
                label.classList.toggle("is-checked", checkbox.checked);
                syncSelectedBadge();
            });

            if (candidate.card_type === "blocker" || candidate.card_type === "blocked") {
                const dot = document.createElement("span");
                dot.className = `dot dot--${candidate.card_type}`;
                label.append(checkbox, dot);
            } else {
                label.appendChild(checkbox);
            }

            const titleSpan = document.createElement("span");
            titleSpan.className = "dep-option-title";
            titleSpan.textContent = candidate.title;

            const metaSpan = document.createElement("span");
            metaSpan.className = "dep-option-meta";
            metaSpan.textContent = getColumnById(candidate.column_id)?.name || "";

            label.append(titleSpan, metaSpan);
            dom.depPickerList.appendChild(label);
        });
    }

    function setModalCardType(cardType) {
        const type = cardType || "task";
        const previousType = dom.taskCardTypeInput.value;
        dom.taskCardTypeInput.value = type;
        dom.taskModalDialog.dataset.cardType = type;
        dom.cardTypeSegmented.querySelectorAll(".seg-btn").forEach((btn) => {
            btn.classList.toggle("is-selected", btn.dataset.cardTypeVal === type);
        });

        const editingId = dom.taskIdInput.value ? Number(dom.taskIdInput.value) : null;
        if (type !== previousType) {
            state.depSearchQuery = "";
            dom.depPickerSearch.value = "";
            const existing = editingId ? findTask(editingId) : null;
            if (existing && type === "blocked") {
                state.modalSelectedDepIds = new Set(existing.blocker_ids || []);
            } else if (existing && type === "blocker") {
                state.modalSelectedDepIds = new Set(existing.blocking_ids || []);
            } else {
                state.modalSelectedDepIds = new Set();
            }
        }
        renderDependencyPicker(type, editingId);
        syncDirtyState();
        requestAnimationFrame(syncModalScrollShadows);
    }

    function openTaskModal(task = null, defaultColumnId = null) {
        clearDependencyHighlight();
        state.lastFocusedElement = document.activeElement;
        state.depSearchQuery = "";
        dom.depPickerSearch.value = "";
        dom.acAddInput.value = "";
        dom.dodAddInput.value = "";
        dom.taskTitleError.hidden = true;
        dom.taskTitleInput.classList.remove("is-invalid");
        dom.taskModalOverlay.classList.remove("is-closing");

        dom.taskColumnInput.innerHTML = "";
        state.columns.forEach((col) => {
            const opt = document.createElement("option");
            opt.value = String(col.id);
            opt.textContent = col.name;
            dom.taskColumnInput.appendChild(opt);
        });

        if (task) {
            dom.taskModalTitle.textContent = "Edit Card";
            dom.taskModalModeBadge.textContent = `Card #${task.id}`;
            dom.taskModalModeBadge.classList.add("is-edit");
            dom.saveTaskBtnLabel.textContent = "Save Changes";

            if (task.updated_at) {
                const dt = new Date(task.updated_at);
                dom.taskModalTimestamp.textContent = `Updated ${dt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                })}`;
                dom.taskModalTimestamp.hidden = false;
            } else {
                dom.taskModalTimestamp.hidden = true;
            }

            dom.taskIdInput.value = String(task.id);
            dom.taskTitleInput.value = task.title;
            dom.taskDescInput.value = task.description || "";
            state.modalAcItems = parseChecklist(task.acceptance_criteria);
            state.modalDodItems = parseChecklist(task.definition_of_done);
            dom.taskColumnInput.value = String(task.column_id);
            dom.taskPriorityInput.value = task.priority;
            dom.taskDueDateInput.value = task.due_date || "";
            dom.modalDeleteBtn.hidden = false;
            dom.modalArchiveBtn.hidden = !isTaskInDone(task);

            const type = task.card_type || "task";
            dom.taskCardTypeInput.value = type;
            state.modalSelectedDepIds = new Set(
                type === "blocked"
                    ? task.blocker_ids || []
                    : type === "blocker"
                    ? task.blocking_ids || []
                    : []
            );
            setModalCardType(type);
        } else {
            dom.taskModalTitle.textContent = "New Card";
            dom.taskModalModeBadge.textContent = "New Card";
            dom.taskModalModeBadge.classList.remove("is-edit");
            dom.taskModalTimestamp.hidden = true;
            dom.saveTaskBtnLabel.textContent = "Create Card";

            dom.taskIdInput.value = "";
            dom.taskTitleInput.value = "";
            dom.taskDescInput.value = "";
            state.modalAcItems = [];
            state.modalDodItems = [];
            dom.taskColumnInput.value = String(defaultColumnId || state.columns[0]?.id || "");
            dom.taskPriorityInput.value =
                state.filters.priority !== "all" ? state.filters.priority : "medium";
            dom.taskDueDateInput.value = "";
            dom.modalDeleteBtn.hidden = true;
            dom.modalArchiveBtn.hidden = true;

            const initialType = state.filters.cardType !== "all" ? state.filters.cardType : "task";
            dom.taskCardTypeInput.value = initialType;
            state.modalSelectedDepIds = new Set();
            setModalCardType(initialType);
        }

        renderChecklistEditor("ac");
        renderChecklistEditor("dod");
        syncModalPropertyDots();
        syncTitleCharCounter();
        state.modalInitialSnapshot = getModalSnapshot();
        dom.modalDirtyPill.hidden = true;
        dom.saveTaskBtn.disabled = false;
        state.isSavingTask = false;

        dom.taskModalOverlay.hidden = false;
        dom.taskModalOverlay.setAttribute("aria-hidden", "false");
        dom.modalScroll.scrollTop = 0;
        requestAnimationFrame(() => {
            autoSizeDescription();
            syncModalScrollShadows();
            dom.taskTitleInput.focus();
        });
    }

    function closeTaskModal(immediate = false) {
        if (dom.taskModalOverlay.hidden) return;
        const finish = () => {
            dom.taskModalOverlay.hidden = true;
            dom.taskModalOverlay.classList.remove("is-closing");
            dom.taskModalOverlay.setAttribute("aria-hidden", "true");
            if (state.lastFocusedElement && document.contains(state.lastFocusedElement)) {
                state.lastFocusedElement.focus();
            }
            state.lastFocusedElement = null;
        };

        if (immediate) {
            finish();
            return;
        }

        dom.taskModalOverlay.classList.add("is-closing");
        setTimeout(finish, 120);
    }

    async function handleSaveTask(event) {
        event.preventDefault();
        if (state.isSavingTask) return;

        const title = dom.taskTitleInput.value.trim();
        if (!title) {
            dom.taskTitleError.textContent = "Please enter a card title.";
            dom.taskTitleError.hidden = false;
            dom.taskTitleInput.classList.add("is-invalid");
            dom.taskTitleInput.focus();
            return;
        }
        dom.taskTitleError.hidden = true;
        dom.taskTitleInput.classList.remove("is-invalid");

        // Flush any unsubmitted text sitting inside the checklist quick-add inputs
        if (dom.acAddInput.value.trim()) addChecklistItemFromInput("ac");
        if (dom.dodAddInput.value.trim()) addChecklistItemFromInput("dod");

        const cardType = dom.taskCardTypeInput.value;
        const selectedIds = [...state.modalSelectedDepIds];

        const payload = {
            title,
            description: dom.taskDescInput.value.trim(),
            acceptance_criteria: serializeChecklist(state.modalAcItems),
            definition_of_done: serializeChecklist(state.modalDodItems),
            column_id: Number(dom.taskColumnInput.value),
            priority: dom.taskPriorityInput.value,
            card_type: cardType,
            due_date: dom.taskDueDateInput.value || null,
        };

        if (cardType === "blocked") {
            payload.blocker_ids = selectedIds;
        } else if (cardType === "blocker") {
            payload.blocking_ids = selectedIds;
        }

        const editingId = dom.taskIdInput.value ? Number(dom.taskIdInput.value) : null;
        state.isSavingTask = true;
        dom.saveTaskBtn.disabled = true;
        const prevLabel = dom.saveTaskBtnLabel.textContent;
        dom.saveTaskBtnLabel.textContent = editingId ? "Saving..." : "Creating...";

        try {
            if (editingId) {
                await apiRequest(`/api/tasks/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                showToast("Card updated");
            } else {
                const created = await apiRequest("/api/tasks", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                state.recentlyCreatedTaskId = created.id;
                showToast("Card created");
            }
            closeTaskModal(true);
            await refreshBoard();
        } catch (err) {
            showToast(err.message, { type: "error" });
        } finally {
            state.isSavingTask = false;
            dom.saveTaskBtn.disabled = false;
            dom.saveTaskBtnLabel.textContent = prevLabel;
        }
    }

    // -------------------------------------------------------------------------
    // Archive Actions & Slide-Over Drawer
    // -------------------------------------------------------------------------

    function formatArchivedAt(isoString) {
        if (!isoString) return "";
        const date = new Date(isoString);
        const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
        if (diffSec < 60) return "Archived just now";
        if (diffSec < 3600) return `Archived ${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `Archived ${Math.floor(diffSec / 3600)}h ago`;
        const formatted = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
        return `Archived ${formatted}`;
    }

    async function loadArchiveTasks() {
        const params = state.archiveQuery ? `?q=${encodeURIComponent(state.archiveQuery)}` : "";
        const data = await apiRequest(`/api/archive${params}`);
        state.archivedTasks = data.tasks;
        if (!state.archiveQuery) {
            state.archivedCount = data.count;
            syncArchiveBadge();
        }
        renderArchiveList();
    }

    function renderArchiveList() {
        dom.archiveList.innerHTML = "";

        if (state.archivedTasks.length === 0) {
            const empty = document.createElement("div");
            empty.className = "archive-empty";
            empty.innerHTML = `
                <span class="archive-empty-icon">${ICONS.archive}</span>
                <h3>${state.archiveQuery ? "No matching archived cards" : "Archive is empty"}</h3>
                <p>${
                    state.archiveQuery
                        ? "Try a different keyword to search past completed cards."
                        : "Save completed cards from the Done column here to keep your board focused."
                }</p>
            `;
            dom.archiveList.appendChild(empty);
            return;
        }

        state.archivedTasks.forEach((task) => {
            const item = document.createElement("article");
            item.className = "archive-card";
            item.dataset.archiveId = String(task.id);
            item.setAttribute("role", "listitem");

            const top = document.createElement("div");
            top.className = "archive-card-top";

            const badges = document.createElement("div");
            badges.className = "task-badges";

            if (task.card_type === "blocked") {
                const pill = document.createElement("span");
                pill.className = "type-pill type-pill--blocked";
                pill.innerHTML = `${ICONS.blocked}<span>Blocked</span>`;
                badges.appendChild(pill);
            } else if (task.card_type === "blocker") {
                const pill = document.createElement("span");
                pill.className = "type-pill type-pill--blocker";
                pill.innerHTML = `${ICONS.blocker}<span>Blocker</span>`;
                badges.appendChild(pill);
            }

            const pri = document.createElement("span");
            pri.className = "priority-label";
            pri.innerHTML = `<span class="priority-dot priority-dot--${task.priority}"></span>${task.priority}`;
            badges.appendChild(pri);

            const dateEl = document.createElement("span");
            dateEl.className = "archive-card-date";
            dateEl.textContent = formatArchivedAt(task.archived_at);

            top.append(badges, dateEl);

            const titleEl = document.createElement("h3");
            titleEl.className = "task-title";
            appendHighlightedText(titleEl, task.title, state.archiveQuery);

            item.append(top, titleEl);

            if (task.description) {
                const descEl = document.createElement("p");
                descEl.className = "task-desc";
                appendHighlightedText(descEl, task.description, state.archiveQuery);
                item.appendChild(descEl);
            }

            const criteriaRow = createCriteriaPills(task);
            if (criteriaRow) {
                item.appendChild(criteriaRow);
            }

            const footer = document.createElement("div");
            footer.className = "archive-card-footer";

            const restoreBtn = document.createElement("button");
            restoreBtn.type = "button";
            restoreBtn.className = "btn btn-ghost btn-sm";
            restoreBtn.dataset.archiveAction = "restore";
            restoreBtn.innerHTML = `${ICONS.restore}<span>Restore to Done</span>`;

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "card-mini-btn card-mini-btn--danger";
            delBtn.dataset.archiveAction = "delete";
            delBtn.title = "Delete permanently";
            delBtn.setAttribute("aria-label", `Delete ${task.title} permanently`);
            delBtn.innerHTML = ICONS.trash;

            footer.append(restoreBtn, delBtn);
            item.appendChild(footer);
            dom.archiveList.appendChild(item);
        });
    }

    async function openArchiveDrawer() {
        clearDependencyHighlight();
        state.lastFocusedElement = document.activeElement;
        state.archiveQuery = "";
        dom.archiveSearchInput.value = "";
        dom.archiveDrawerOverlay.classList.remove("is-closing");
        dom.archiveDrawerOverlay.hidden = false;
        dom.archiveDrawerOverlay.setAttribute("aria-hidden", "false");
        try {
            await loadArchiveTasks();
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
        requestAnimationFrame(() => dom.archiveSearchInput.focus());
    }

    function closeArchiveDrawer(immediate = false) {
        if (dom.archiveDrawerOverlay.hidden) return;
        const finish = () => {
            dom.archiveDrawerOverlay.hidden = true;
            dom.archiveDrawerOverlay.classList.remove("is-closing");
            dom.archiveDrawerOverlay.setAttribute("aria-hidden", "true");
            if (state.lastFocusedElement && document.contains(state.lastFocusedElement)) {
                state.lastFocusedElement.focus();
            }
            state.lastFocusedElement = null;
        };
        if (immediate) {
            finish();
            return;
        }
        dom.archiveDrawerOverlay.classList.add("is-closing");
        setTimeout(finish, 140);
    }

    async function handleArchiveTask(task) {
        try {
            await apiRequest(`/api/tasks/${task.id}/archive`, { method: "POST" });
            closeTaskModal(true);
            await refreshBoard();
            showToast(`Archived "${task.title}"`, {
                duration: 5000,
                actionLabel: "Undo",
                onAction: async () => {
                    await handleRestoreTask(task.id);
                },
            });
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    async function handleArchiveAllDone() {
        try {
            const res = await apiRequest("/api/archive/done", { method: "POST" });
            if (res.archived_count === 0) return;
            await refreshBoard();
            showToast(
                `Archived ${res.archived_count} completed card${res.archived_count > 1 ? "s" : ""}`
            );
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    async function handleRestoreTask(taskId) {
        try {
            await apiRequest(`/api/tasks/${taskId}/restore`, { method: "POST" });
            state.recentlyCreatedTaskId = taskId;
            await refreshBoard();
            if (!dom.archiveDrawerOverlay.hidden) {
                await loadArchiveTasks();
            }
            showToast("Restored card to Done");
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    async function handleDeleteArchivedTask(taskId) {
        try {
            await apiRequest(`/api/tasks/${taskId}`, { method: "DELETE" });
            await loadArchiveTasks();
            await refreshBoard();
            showToast("Permanently deleted");
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    // -------------------------------------------------------------------------
    // Theme (with smooth crossfade)
    // -------------------------------------------------------------------------

    function syncThemeButton() {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        dom.themeToggleBtn.innerHTML = isDark ? ICONS.sun : ICONS.moon;
        dom.themeToggleBtn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
    }

    function toggleTheme() {
        document.documentElement.classList.add("is-theme-transitioning");
        const next =
            document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("kanban-theme", next);
        syncThemeButton();
        setTimeout(() => {
            document.documentElement.classList.remove("is-theme-transitioning");
        }, 240);
    }

    // -------------------------------------------------------------------------
    // Event Listeners
    // -------------------------------------------------------------------------

    function bindEvents() {
        dom.newTaskBtn.addEventListener("click", () => openTaskModal());
        dom.openArchiveBtn.addEventListener("click", openArchiveDrawer);
        dom.closeArchiveBtn.addEventListener("click", () => closeArchiveDrawer());
        dom.archiveDrawerOverlay.addEventListener("click", (event) => {
            if (event.target === dom.archiveDrawerOverlay) closeArchiveDrawer();
        });
        dom.archiveSearchInput.addEventListener("input", () => {
            state.archiveQuery = dom.archiveSearchInput.value.trim();
            loadArchiveTasks().catch((err) => showToast(err.message, { type: "error" }));
        });
        dom.archiveList.addEventListener("click", (event) => {
            const btn = event.target.closest("[data-archive-action]");
            if (!btn) return;
            const item = btn.closest(".archive-card");
            if (!item) return;
            const id = Number(item.dataset.archiveId);
            if (btn.dataset.archiveAction === "restore") {
                handleRestoreTask(id);
            } else if (btn.dataset.archiveAction === "delete") {
                handleDeleteArchivedTask(id);
            }
        });

        dom.themeToggleBtn.addEventListener("click", toggleTheme);
        dom.depBannerClear.addEventListener("click", () => clearDependencyHighlight());

        // Filters
        dom.searchInput.addEventListener("input", () => {
            state.filters.query = dom.searchInput.value.trim();
            renderBoard();
        });

        dom.clearSearchBtn.addEventListener("click", () => {
            dom.searchInput.value = "";
            state.filters.query = "";
            renderBoard();
            dom.searchInput.focus();
        });

        dom.cardTypeFilters.addEventListener("click", (event) => {
            const btn = event.target.closest(".chip-btn");
            if (!btn) return;
            state.filters.cardType = btn.dataset.cardType;
            dom.cardTypeFilters
                .querySelectorAll(".chip-btn")
                .forEach((b) => b.classList.toggle("is-active", b === btn));
            renderBoard();
        });

        dom.priorityFilter.addEventListener("change", () => {
            state.filters.priority = dom.priorityFilter.value;
            renderBoard();
        });

        dom.resetFiltersBtn.addEventListener("click", () => {
            state.filters.query = "";
            state.filters.cardType = "all";
            state.filters.priority = "all";
            dom.searchInput.value = "";
            dom.priorityFilter.value = "all";
            dom.cardTypeFilters
                .querySelectorAll(".chip-btn")
                .forEach((b) => b.classList.toggle("is-active", b.dataset.cardType === "all"));
            renderBoard();
        });

        // Board clicks
        dom.boardGrid.addEventListener("click", (event) => {
            const addBtn = event.target.closest("[data-add-column-id]");
            if (addBtn) {
                openTaskModal(null, Number(addBtn.dataset.addColumnId));
                return;
            }

            const quickAdd = event.target.closest("[data-quick-add-col]");
            if (quickAdd) {
                state.quickAddColumnId = Number(quickAdd.dataset.quickAddCol);
                renderBoard();
                return;
            }

            const actionBtn = event.target.closest("[data-action]");
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                if (action === "archive-all-done") {
                    handleArchiveAllDone();
                    return;
                }

                const card = actionBtn.closest(".task-card");
                if (!card) return;
                const taskId = Number(card.dataset.taskId);
                const task = findTask(taskId);
                if (!task) return;

                if (action === "pin-dep") {
                    if (state.pinnedSpotlightTaskId === taskId) {
                        clearDependencyHighlight();
                    } else {
                        highlightDependencies(taskId, { isPinned: true });
                    }
                } else if (action === "archive") {
                    handleArchiveTask(task);
                } else if (action === "delete") {
                    handleDeleteTaskWithUndo(task);
                } else if (action === "move-prev") {
                    handleQuickMove(taskId, -1);
                } else if (action === "move-next") {
                    handleQuickMove(taskId, 1);
                }
                return;
            }

            const card = event.target.closest(".task-card");
            if (card && !event.target.closest("button")) {
                const task = findTask(Number(card.dataset.taskId));
                if (task) openTaskModal(task);
                return;
            }

            // Clicking empty board space unpins spotlight
            if (state.pinnedSpotlightTaskId !== null) {
                clearDependencyHighlight();
            }
        });

        // Keep SVG arrows aligned on board/column scroll or resize
        const redrawIfActive = () => {
            if (state.activeSpotlightTaskId !== null) {
                highlightDependencies(state.activeSpotlightTaskId, {
                    isPinned: state.pinnedSpotlightTaskId === state.activeSpotlightTaskId,
                });
            }
        };
        dom.boardContainer.addEventListener("scroll", redrawIfActive, { passive: true });
        dom.boardGrid.addEventListener("scroll", redrawIfActive, { passive: true, capture: true });
        window.addEventListener("resize", redrawIfActive, { passive: true });

        // Modal events
        dom.modalScroll.addEventListener("scroll", syncModalScrollShadows, { passive: true });
        dom.taskTitleInput.addEventListener("input", () => {
            syncTitleCharCounter();
            syncDirtyState();
            if (dom.taskTitleInput.value.trim()) {
                dom.taskTitleError.hidden = true;
                dom.taskTitleInput.classList.remove("is-invalid");
            }
        });
        dom.taskDescInput.addEventListener("input", () => {
            autoSizeDescription();
            syncDirtyState();
        });
        dom.taskColumnInput.addEventListener("change", syncModalPropertyDots);
        dom.taskPriorityInput.addEventListener("change", syncModalPropertyDots);
        dom.taskDueDateInput.addEventListener("change", syncModalPropertyDots);
        dom.dueTodayBtn.addEventListener("click", () => {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            dom.taskDueDateInput.value = `${yyyy}-${mm}-${dd}`;
            syncModalPropertyDots();
        });
        dom.clearDueDateBtn.addEventListener("click", () => {
            dom.taskDueDateInput.value = "";
            syncModalPropertyDots();
        });

        // Interactive Acceptance Criteria & Definition of Done checklists
        dom.acCounter.addEventListener("click", () => toggleAllChecklistItems("ac"));
        dom.dodCounter.addEventListener("click", () => toggleAllChecklistItems("dod"));
        dom.dodPresetBtn.addEventListener("click", () => {
            STANDARD_DOD_ITEMS.forEach((text) => state.modalDodItems.push({ text, done: false }));
            renderChecklistEditor("dod");
            syncDirtyState();
        });

        const bindChecklistControls = (kind, inputEl, btnEl) => {
            btnEl.addEventListener("click", () => addChecklistItemFromInput(kind));
            inputEl.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    addChecklistItemFromInput(kind);
                }
            });
            inputEl.addEventListener("paste", (event) => {
                const pasted = event.clipboardData?.getData("text") || "";
                if (pasted.includes("\n")) {
                    event.preventDefault();
                    const targetItems = kind === "ac" ? state.modalAcItems : state.modalDodItems;
                    parseChecklist(pasted).forEach((entry) => targetItems.push(entry));
                    renderChecklistEditor(kind);
                    syncDirtyState();
                }
            });
        };
        bindChecklistControls("ac", dom.acAddInput, dom.acAddBtn);
        bindChecklistControls("dod", dom.dodAddInput, dom.dodAddBtn);

        // Keep Tab focus cleanly inside the active modal dialog
        dom.taskModalDialog.addEventListener("keydown", (event) => {
            if (event.key !== "Tab") return;
            const focusables = [
                ...dom.taskModalDialog.querySelectorAll(
                    'button:not([hidden]):not([disabled]), input:not([type="hidden"]):not([hidden]):not([disabled]), select:not([hidden]):not([disabled]), textarea:not([hidden]):not([disabled])'
                ),
            ].filter((el) => el.offsetParent !== null);
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        dom.cardTypeSegmented.addEventListener("click", (event) => {
            const btn = event.target.closest(".seg-btn");
            if (btn) setModalCardType(btn.dataset.cardTypeVal);
        });
        dom.depPickerSearch.addEventListener("input", () => {
            state.depSearchQuery = dom.depPickerSearch.value;
            const editingId = dom.taskIdInput.value ? Number(dom.taskIdInput.value) : null;
            renderDependencyPicker(dom.taskCardTypeInput.value, editingId);
        });
        dom.taskForm.addEventListener("submit", handleSaveTask);
        dom.taskForm.addEventListener("keydown", (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                dom.taskForm.requestSubmit();
            }
        });
        dom.closeTaskModalBtn.addEventListener("click", () => closeTaskModal());
        dom.cancelTaskModalBtn.addEventListener("click", () => closeTaskModal());
        dom.taskModalOverlay.addEventListener("click", (event) => {
            if (event.target === dom.taskModalOverlay) closeTaskModal();
        });
        dom.modalDeleteBtn.addEventListener("click", () => {
            const id = Number(dom.taskIdInput.value);
            const task = findTask(id);
            if (task) handleDeleteTaskWithUndo(task);
        });
        dom.modalArchiveBtn.addEventListener("click", () => {
            const id = Number(dom.taskIdInput.value);
            const task = findTask(id);
            if (task) handleArchiveTask(task);
        });

        // Keyboard shortcuts
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                if (!dom.taskModalOverlay.hidden) {
                    closeTaskModal();
                } else if (!dom.archiveDrawerOverlay.hidden) {
                    closeArchiveDrawer();
                } else if (state.pinnedSpotlightTaskId !== null) {
                    clearDependencyHighlight();
                } else if (state.quickAddColumnId !== null) {
                    state.quickAddColumnId = null;
                    renderBoard();
                }
                return;
            }

            const tag = document.activeElement?.tagName;
            const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
            if (
                isTyping ||
                !dom.taskModalOverlay.hidden ||
                !dom.archiveDrawerOverlay.hidden ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey
            ) {
                return;
            }

            if (event.key === "n" || event.key === "N") {
                event.preventDefault();
                openTaskModal();
            } else if (event.key === "a" || event.key === "A") {
                event.preventDefault();
                openArchiveDrawer();
            } else if (event.key === "/") {
                event.preventDefault();
                dom.searchInput.focus();
            }
        });
    }

    // -------------------------------------------------------------------------
    // Bootstrap
    // -------------------------------------------------------------------------

    function init() {
        syncThemeButton();
        const initialScript = document.getElementById("initialBoardData");
        if (initialScript) {
            try {
                const parsed = JSON.parse(initialScript.textContent || "{}");
                state.columns = Array.isArray(parsed) ? parsed : parsed.columns || [];
                state.archivedCount = Array.isArray(parsed) ? 0 : parsed.archived_count || 0;
            } catch {
                state.columns = [];
                state.archivedCount = 0;
            }
        }
        syncArchiveBadge();
        bindEvents();
        renderBoard();
    }

    init();
})();
