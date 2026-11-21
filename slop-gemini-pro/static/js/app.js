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
        clock: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        chevronDown: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
        dots: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"></circle><circle cx="12" cy="12" r="1.6"></circle><circle cx="19" cy="12" r="1.6"></circle></svg>`,
        moon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
        sun: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    };

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

    const state = {
        columns: [],
        archivedTasks: [],
        archivedCount: 0,
        archiveQuery: "",
        archiveFilter: "all",
        archiveSort: "newest",
        expandedArchiveIds: new Set(),
        confirmDeleteArchiveId: null,
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
        confirmingDiscard: false,
        selectedTaskIds: new Set(),
        columnSorts: {},
        activeMobileColumnId: null,
        cmdSelectedIndex: 0,
        cmdItems: [],
        lastFocusedElement: null,
    };

    // -------------------------------------------------------------------------
    // DOM References
    // -------------------------------------------------------------------------

    const dom = {
        boardContainer: document.getElementById("boardContainer"),
        boardStage: document.getElementById("boardStage"),
        boardGrid: document.getElementById("boardGrid"),
        mobileColTabs: document.getElementById("mobileColTabs"),
        dependencyLines: document.getElementById("dependencyLines"),
        srAnnouncer: document.getElementById("srAnnouncer"),

        depBanner: document.getElementById("depBanner"),
        depBannerDot: document.getElementById("depBannerDot"),
        depBannerText: document.getElementById("depBannerText"),
        depBannerActions: document.getElementById("depBannerActions"),
        depBannerClear: document.getElementById("depBannerClear"),

        bulkActionBar: document.getElementById("bulkActionBar"),
        bulkCountLabel: document.getElementById("bulkCountLabel"),
        bulkMoveSelect: document.getElementById("bulkMoveSelect"),
        bulkPrioritySelect: document.getElementById("bulkPrioritySelect"),
        bulkArchiveBtn: document.getElementById("bulkArchiveBtn"),
        bulkDeleteBtn: document.getElementById("bulkDeleteBtn"),
        bulkClearBtn: document.getElementById("bulkClearBtn"),

        floatingPopover: document.getElementById("floatingPopover"),

        columnModalOverlay: document.getElementById("columnModalOverlay"),
        columnModalTitle: document.getElementById("columnModalTitle"),
        closeColumnModalBtn: document.getElementById("closeColumnModalBtn"),
        cancelColumnModalBtn: document.getElementById("cancelColumnModalBtn"),
        columnForm: document.getElementById("columnForm"),
        columnIdInput: document.getElementById("columnIdInput"),
        columnNameInput: document.getElementById("columnNameInput"),
        columnNameError: document.getElementById("columnNameError"),
        columnWipInput: document.getElementById("columnWipInput"),
        colorSwatches: document.getElementById("colorSwatches"),
        columnColorInput: document.getElementById("columnColorInput"),
        deleteColumnBtn: document.getElementById("deleteColumnBtn"),

        cmdPaletteOverlay: document.getElementById("cmdPaletteOverlay"),
        cmdPaletteInput: document.getElementById("cmdPaletteInput"),
        cmdPaletteResults: document.getElementById("cmdPaletteResults"),

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
        modalFooterDefault: document.getElementById("modalFooterDefault"),
        modalDiscardBar: document.getElementById("modalDiscardBar"),
        keepEditingBtn: document.getElementById("keepEditingBtn"),
        confirmDiscardBtn: document.getElementById("confirmDiscardBtn"),
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
        archiveSummary: document.getElementById("archiveSummary"),
        archiveStatLatest: document.getElementById("archiveStatLatest"),
        archiveStatCycle: document.getElementById("archiveStatCycle"),
        archiveStatDod: document.getElementById("archiveStatDod"),
        closeArchiveBtn: document.getElementById("closeArchiveBtn"),
        archiveSearchInput: document.getElementById("archiveSearchInput"),
        archiveSortSelect: document.getElementById("archiveSortSelect"),
        archiveTypeFilters: document.getElementById("archiveTypeFilters"),
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

    function announce(message) {
        if (!dom.srAnnouncer) return;
        dom.srAnnouncer.textContent = "";
        requestAnimationFrame(() => {
            dom.srAnnouncer.textContent = message;
        });
    }

    function isoDateOffset(daysFromToday = 0) {
        const d = new Date();
        d.setDate(d.getDate() + daysFromToday);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
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
            .filter((entry) => entry.task);

        const visibleEntries = targetEntries.filter((entry) => entry.el);
        const hiddenCount = targetEntries.length - visibleEntries.length;

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

        visibleEntries.forEach(({ task: targetTask, el: targetCard }) => {
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

        // Detect visible cards scrolled outside their column's scroll viewport
        const offscreenEntry = visibleEntries.find(({ el }) => {
            const list = el.closest(".task-list");
            if (!list) return false;
            const lr = list.getBoundingClientRect();
            const er = el.getBoundingClientRect();
            return er.bottom < lr.top + 8 || er.top > lr.bottom - 8;
        });

        drawDependencyConnectors(sourceCard, visibleEntries, mode);
        updateSpotlightBanner(task, targetEntries, mode, isPinned, hiddenCount, offscreenEntry);
    }

    function updateSpotlightBanner(task, targetEntries, mode, isPinned, hiddenCount, offscreenEntry) {
        const count = targetEntries.length;
        dom.depBannerActions.innerHTML = "";

        if (mode === "show-blockers") {
            const openCount = targetEntries.filter((e) => !isTaskInDone(e.task)).length;
            dom.depBannerDot.style.backgroundColor =
                openCount > 0 ? "var(--blocker-color)" : "var(--resolved-color)";
            const baseText =
                openCount === 0
                    ? `All ${count} blocker${count > 1 ? "s" : ""} resolved for "${task.title}"`
                    : `${openCount} active blocker${openCount > 1 ? "s" : ""} for "${task.title}"`;
            dom.depBannerText.textContent =
                hiddenCount > 0 ? `${baseText} · ${hiddenCount} hidden by filter` : baseText;

            if (openCount === 0) {
                const unblockBtn = document.createElement("button");
                unblockBtn.type = "button";
                unblockBtn.className = "dep-banner-btn dep-banner-btn--resolved";
                unblockBtn.textContent = "Unblock";
                unblockBtn.addEventListener("click", () => handleUnblockTask(task));
                dom.depBannerActions.appendChild(unblockBtn);
            }
        } else {
            dom.depBannerDot.style.backgroundColor = "var(--blocked-color)";
            const baseText = `"${task.title}" blocks ${count} card${count > 1 ? "s" : ""}`;
            dom.depBannerText.textContent =
                hiddenCount > 0 ? `${baseText} · ${hiddenCount} hidden by filter` : baseText;
        }

        if (hiddenCount > 0) {
            const showBtn = document.createElement("button");
            showBtn.type = "button";
            showBtn.className = "dep-banner-btn";
            showBtn.textContent = "Show all";
            showBtn.addEventListener("click", () => {
                resetAllFilters();
                highlightDependencies(task.id, { isPinned: true });
            });
            dom.depBannerActions.appendChild(showBtn);
        }

        if (offscreenEntry?.el) {
            const jumpBtn = document.createElement("button");
            jumpBtn.type = "button";
            jumpBtn.className = "dep-banner-btn";
            jumpBtn.textContent = "Jump to card";
            jumpBtn.addEventListener("click", () => {
                const targetCol = offscreenEntry.el.closest(".kanban-column");
                if (targetCol) {
                    state.activeMobileColumnId = Number(targetCol.dataset.columnId);
                    syncMobileTabs();
                }
                offscreenEntry.el.scrollIntoView({ behavior: "smooth", block: "center" });
                offscreenEntry.el.classList.remove("is-jump-pulse");
                void offscreenEntry.el.offsetWidth;
                offscreenEntry.el.classList.add("is-jump-pulse");
                setTimeout(() => {
                    if (state.activeSpotlightTaskId === task.id) {
                        highlightDependencies(task.id, { isPinned: true });
                    }
                }, 260);
            });
            dom.depBannerActions.appendChild(jumpBtn);
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

    function sortColumnTasks(tasks, columnId) {
        const sortMode = state.columnSorts[columnId] || "manual";
        if (sortMode === "manual") return tasks;
        const copy = [...tasks];
        if (sortMode === "priority") {
            copy.sort(
                (a, b) =>
                    (PRIORITY_RANK[a.priority] ?? 9) -
                    (PRIORITY_RANK[b.priority] ?? 9)
            );
        } else if (sortMode === "due_date") {
            copy.sort((a, b) => {
                if (!a.due_date && !b.due_date) return a.position - b.position;
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return a.due_date.localeCompare(b.due_date);
            });
        }
        return copy;
    }

    function syncMobileTabs() {
        if (state.columns.length === 0) return;
        if (
            state.activeMobileColumnId === null ||
            !state.columns.some((c) => c.id === state.activeMobileColumnId)
        ) {
            state.activeMobileColumnId = state.columns[0].id;
        }
        dom.mobileColTabs.innerHTML = "";
        state.columns.forEach((col) => {
            const visibleCount = col.tasks.filter(matchesFilters).length;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `mobile-tab-btn${col.id === state.activeMobileColumnId ? " is-active" : ""}`;
            btn.dataset.mobileColId = String(col.id);
            btn.innerHTML = `<span class="column-dot" style="background-color:${col.color};"></span><span></span><span class="mobile-tab-count">${visibleCount}</span>`;
            btn.querySelector("span:nth-child(2)").textContent = col.name;
            dom.mobileColTabs.appendChild(btn);
        });

        dom.boardGrid.querySelectorAll(".kanban-column").forEach((colEl) => {
            colEl.classList.toggle(
                "is-mobile-active",
                Number(colEl.dataset.columnId) === state.activeMobileColumnId
            );
        });
    }

    function renderBoard() {
        const prevPinned = state.pinnedSpotlightTaskId;
        clearDependencyHighlight();
        closeFloatingPopover();
        dom.boardGrid.innerHTML = "";
        const totalColumns = state.columns.length;
        if (totalColumns > 0) {
            dom.boardGrid.style.setProperty("--board-cols", String(totalColumns));
        }

        // Remove any deleted IDs from bulk selection
        const activeIdSet = new Set(getAllTasks().map((t) => t.id));
        [...state.selectedTaskIds].forEach((id) => {
            if (!activeIdSet.has(id)) state.selectedTaskIds.delete(id);
        });

        state.columns.forEach((column, colIndex) => {
            const visibleTasks = sortColumnTasks(column.tasks.filter(matchesFilters), column.id);
            const isOverWip = Boolean(column.wip_limit && column.tasks.length > column.wip_limit);
            const sortMode = state.columnSorts[column.id] || "manual";

            const colEl = document.createElement("section");
            colEl.className = `kanban-column${isOverWip ? " is-over-wip" : ""}`;
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
            count.className = `column-count${isOverWip ? " is-over-wip" : ""}`;
            if (column.wip_limit) {
                count.textContent = `${column.tasks.length}/${column.wip_limit}`;
                count.title = isOverWip
                    ? `WIP limit exceeded (${column.tasks.length} of ${column.wip_limit})`
                    : `WIP limit: ${column.wip_limit}`;
            } else {
                count.textContent =
                    visibleTasks.length === column.tasks.length
                        ? String(column.tasks.length)
                        : `${visibleTasks.length}/${column.tasks.length}`;
            }

            titleGroup.append(dot, title, count);

            if (sortMode !== "manual") {
                const sortBadge = document.createElement("span");
                sortBadge.className = "column-sort-indicator";
                sortBadge.textContent = sortMode === "priority" ? "Priority" : "Due";
                titleGroup.appendChild(sortBadge);
            }

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

            const menuBtn = document.createElement("button");
            menuBtn.type = "button";
            menuBtn.className = "icon-btn column-add-btn";
            menuBtn.dataset.columnMenuId = String(column.id);
            menuBtn.title = `${column.name} options`;
            menuBtn.setAttribute("aria-label", `${column.name} options`);
            menuBtn.innerHTML = ICONS.dots;
            headerActions.appendChild(menuBtn);

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

        syncMobileTabs();
        syncBulkBar();
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

    function createCriteriaPills(task, { interactive = false } = {}) {
        const acItems = parseChecklist(task.acceptance_criteria);
        const dodItems = parseChecklist(task.definition_of_done);
        if (acItems.length === 0 && dodItems.length === 0) return null;

        const row = document.createElement("div");
        row.className = "task-criteria-row";

        if (acItems.length > 0) {
            const acDone = acItems.filter((i) => i.done).length;
            const ac = document.createElement(interactive ? "button" : "span");
            if (interactive) {
                ac.type = "button";
                ac.dataset.action = "inline-ac";
            }
            ac.className = `criteria-pill${acDone === acItems.length ? " criteria-pill--dod" : ""}${
                interactive ? " criteria-pill-btn" : ""
            }`;
            ac.title = `Acceptance Criteria${interactive ? " (click to check off)" : ""}:\n${acItems
                .map((i) => `${i.done ? "✓" : "○"} ${i.text}`)
                .join("\n")}`;
            const label = acDone > 0 ? `AC · ${acDone}/${acItems.length}` : `AC · ${acItems.length}`;
            ac.innerHTML = `${ICONS.checklist}<span>${label}</span>`;
            row.appendChild(ac);
        }

        if (dodItems.length > 0) {
            const dodDone = dodItems.filter((i) => i.done).length;
            const dod = document.createElement(interactive ? "button" : "span");
            if (interactive) {
                dod.type = "button";
                dod.dataset.action = "inline-dod";
            }
            dod.className = `criteria-pill criteria-pill--dod${interactive ? " criteria-pill-btn" : ""}`;
            dod.title = `Definition of Done${interactive ? " (click to check off)" : ""}:\n${dodItems
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
        const isSelected = state.selectedTaskIds.has(task.id);

        const card = document.createElement("article");
        card.className = `task-card${cardType !== "task" ? ` task-card--${cardType}` : ""}${
            isSelected ? " is-selected" : ""
        }`;
        card.draggable = true;
        card.tabIndex = 0;
        card.dataset.taskId = String(task.id);
        card.dataset.columnId = String(task.column_id);
        card.dataset.priority = task.priority;
        card.dataset.cardType = cardType;
        card.setAttribute("role", "listitem");
        card.setAttribute("aria-selected", String(isSelected));

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

        const pri = document.createElement("button");
        pri.type = "button";
        pri.className = "priority-label priority-label-btn";
        pri.dataset.action = "inline-priority";
        pri.title = "Change priority";
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

        // Compact interactive Acceptance Criteria & Definition of Done indicators
        const criteriaRow = createCriteriaPills(task, { interactive: true });
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
                const leftWrap = document.createElement("div");
                leftWrap.className = "task-badges";

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
                    leftWrap.appendChild(depBtn);

                    if (allResolved) {
                        const unblockBtn = document.createElement("button");
                        unblockBtn.type = "button";
                        unblockBtn.className = "unblock-inline-btn";
                        unblockBtn.dataset.action = "quick-unblock";
                        unblockBtn.title = "Mark card as unblocked";
                        unblockBtn.textContent = "Unblock";
                        leftWrap.appendChild(unblockBtn);
                    }
                } else {
                    const linkedBlocked = blockingIds.map((id) => findTask(id)).filter(Boolean);
                    depBtn.className = "dep-summary-btn dep-summary-btn--blocker";
                    depBtn.innerHTML = `${ICONS.link}<span>Blocks ${blockingIds.length}</span>`;
                    depBtn.title = `Click to pin · Blocks: ${linkedBlocked
                        .map((b) => b.title)
                        .join(", ")}`;
                    leftWrap.appendChild(depBtn);
                }
                footer.appendChild(leftWrap);
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
                const dateBtn = document.createElement("button");
                dateBtn.type = "button";
                dateBtn.dataset.action = "inline-due";
                dateBtn.title = "Change due date";
                dateBtn.className = `task-date task-date-btn${dueInfo.overdue ? " is-overdue" : ""}`;
                dateBtn.innerHTML = `${ICONS.calendar}<span></span>`;
                dateBtn.querySelector("span").textContent = dueInfo.text;
                footer.appendChild(dateBtn);
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
            if (event.target !== card) return;
            if (event.key === "Enter") {
                event.preventDefault();
                openTaskModal(task);
            } else if (event.shiftKey && event.key === "ArrowLeft") {
                event.preventDefault();
                handleQuickMove(task.id, -1);
            } else if (event.shiftKey && event.key === "ArrowRight") {
                event.preventDefault();
                handleQuickMove(task.id, 1);
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const list = card.closest(".task-list");
                const siblings = [...list.querySelectorAll(".task-card")];
                const idx = siblings.indexOf(card);
                const next = siblings[idx + (event.key === "ArrowDown" ? 1 : -1)];
                if (next) next.focus();
            } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                const cols = [...dom.boardGrid.querySelectorAll(".kanban-column")];
                const curCol = card.closest(".kanban-column");
                const curIdx = cols.indexOf(curCol);
                const dir = event.key === "ArrowRight" ? 1 : -1;
                for (let i = curIdx + dir; i >= 0 && i < cols.length; i += dir) {
                    const targetCard = cols[i].querySelector(".task-card");
                    if (targetCard) {
                        targetCard.focus();
                        break;
                    }
                }
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
            const targetCol = getColumnById(targetColumnId);
            if (targetCol) {
                announce(`Moved card to ${targetCol.name}`);
            }
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
        setDiscardConfirmation(false);
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

    function isModalDirty() {
        return Boolean(
            state.modalInitialSnapshot && getModalSnapshot() !== state.modalInitialSnapshot
        );
    }

    function setDiscardConfirmation(show) {
        state.confirmingDiscard = show;
        dom.modalDiscardBar.hidden = !show;
        dom.modalFooterDefault.hidden = show;
    }

    function requestCloseTaskModal() {
        if (dom.taskModalOverlay.hidden) return;
        if (isModalDirty() && !state.confirmingDiscard) {
            setDiscardConfirmation(true);
            return;
        }
        closeTaskModal();
    }

    function closeTaskModal(immediate = false) {
        if (dom.taskModalOverlay.hidden) return;
        const finish = () => {
            dom.taskModalOverlay.hidden = true;
            dom.taskModalOverlay.classList.remove("is-closing");
            dom.taskModalOverlay.setAttribute("aria-hidden", "true");
            setDiscardConfirmation(false);
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
    // Archive Actions & Polished Slide-Over Drawer
    // -------------------------------------------------------------------------

    function formatExactTimestamp(isoString) {
        if (!isoString) return "—";
        const d = new Date(isoString);
        if (Number.isNaN(d.getTime())) return isoString;
        return d.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }

    function formatRelativeTime(isoString) {
        if (!isoString) return "—";
        const date = new Date(isoString);
        const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
        if (diffSec < 60) return "just now";
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        const days = Math.floor(diffSec / 86400);
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    function formatArchivedStamp(isoString) {
        if (!isoString) return "";
        const date = new Date(isoString);
        const now = new Date();
        const sameDay = date.toDateString() === now.toDateString();
        const timeStr = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
        const rel = formatRelativeTime(isoString);
        if (sameDay) {
            return `${timeStr} · ${rel}`;
        }
        const dayStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return `${dayStr}, ${timeStr}`;
    }

    function formatDurationMs(ms) {
        if (ms < 0 || !Number.isFinite(ms)) return "—";
        const totalMin = Math.floor(ms / 60000);
        if (totalMin < 1) return "< 1m";
        if (totalMin < 60) return `${totalMin}m`;
        const totalHours = Math.floor(totalMin / 60);
        const remMin = totalMin % 60;
        if (totalHours < 24) return remMin > 0 ? `${totalHours}h ${remMin}m` : `${totalHours}h`;
        const days = Math.floor(totalHours / 24);
        const remHours = totalHours % 24;
        return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
    }

    function getCycleTimeMs(task) {
        if (!task.created_at || !task.archived_at) return null;
        const diff = new Date(task.archived_at).getTime() - new Date(task.created_at).getTime();
        return Number.isFinite(diff) && diff >= 0 ? diff : null;
    }

    function getArchiveDateGroupLabel(isoString) {
        if (!isoString) return "Earlier";
        const date = new Date(isoString);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.round((startOfToday - startOfTarget) / 86400000);

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays > 1 && diffDays < 7) return "Earlier This Week";
        return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    }

    function getDueCompletionStatus(task) {
        if (!task.due_date || !task.archived_at) return null;
        const [y, m, d] = task.due_date.split("-").map(Number);
        const endOfDueDay = new Date(y, m - 1, d, 23, 59, 59, 999);
        const archivedDate = new Date(task.archived_at);
        const onTime = archivedDate.getTime() <= endOfDueDay.getTime();
        const shortDue = new Date(y, m - 1, d).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
        return { onTime, shortDue };
    }

    function updateArchiveSummary(tasks) {
        if (tasks.length === 0) {
            dom.archiveSummary.hidden = true;
            return;
        }
        dom.archiveSummary.hidden = false;

        // Latest archived timestamp
        const sortedByRecent = [...tasks].sort((a, b) =>
            (b.archived_at || "").localeCompare(a.archived_at || "")
        );
        dom.archiveStatLatest.textContent = formatRelativeTime(sortedByRecent[0]?.archived_at);
        dom.archiveStatLatest.title = formatExactTimestamp(sortedByRecent[0]?.archived_at);

        // Average cycle time (created -> archived)
        const cycles = tasks.map(getCycleTimeMs).filter((v) => v !== null);
        if (cycles.length > 0) {
            const avg = cycles.reduce((sum, v) => sum + v, 0) / cycles.length;
            dom.archiveStatCycle.textContent = formatDurationMs(avg);
        } else {
            dom.archiveStatCycle.textContent = "—";
        }

        // DoD completion across archived tasks
        let dodDone = 0;
        let dodTotal = 0;
        tasks.forEach((t) => {
            const items = parseChecklist(t.definition_of_done);
            dodTotal += items.length;
            dodDone += items.filter((i) => i.done).length;
        });
        dom.archiveStatDod.textContent = dodTotal > 0 ? `${dodDone}/${dodTotal}` : "None";
    }

    function getFilteredAndSortedArchive() {
        let items = [...state.archivedTasks];

        if (state.archiveFilter === "high_priority") {
            items = items.filter((t) => t.priority === "high" || t.priority === "urgent");
        } else if (state.archiveFilter === "blocker") {
            items = items.filter((t) => t.card_type === "blocker");
        } else if (state.archiveFilter === "blocked") {
            items = items.filter((t) => t.card_type === "blocked");
        }

        if (state.archiveSort === "oldest") {
            items.sort((a, b) => (a.archived_at || "").localeCompare(b.archived_at || ""));
        } else if (state.archiveSort === "priority") {
            items.sort(
                (a, b) =>
                    (PRIORITY_RANK[a.priority] ?? 9) -
                    (PRIORITY_RANK[b.priority] ?? 9)
            );
        } else {
            items.sort((a, b) => (b.archived_at || "").localeCompare(a.archived_at || ""));
        }

        return items;
    }

    async function loadArchiveTasks() {
        const params = state.archiveQuery ? `?q=${encodeURIComponent(state.archiveQuery)}` : "";
        const data = await apiRequest(`/api/archive${params}`);
        state.archivedTasks = data.tasks;
        if (!state.archiveQuery) {
            state.archivedCount = data.count;
            syncArchiveBadge();
        }
        updateArchiveSummary(state.archivedTasks);
        renderArchiveList();
    }

    function buildArchiveCard(task) {
        const isExpanded = state.expandedArchiveIds.has(task.id);
        const isConfirmingDelete = state.confirmDeleteArchiveId === task.id;
        const cycleMs = getCycleTimeMs(task);
        const dueStatus = getDueCompletionStatus(task);

        const item = document.createElement("article");
        item.className = `archive-card${isExpanded ? " is-expanded" : ""}`;
        item.dataset.archiveId = String(task.id);
        item.setAttribute("role", "listitem");

        // Top row: badges + card ID
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

        const idTag = document.createElement("span");
        idTag.className = "archive-card-id";
        idTag.textContent = `#${task.id}`;

        top.append(badges, idTag);

        // Clickable summary block (toggles full expanded inspection)
        const summaryBtn = document.createElement("button");
        summaryBtn.type = "button";
        summaryBtn.className = "archive-card-summary-btn";
        summaryBtn.dataset.archiveAction = "toggle-expand";
        summaryBtn.setAttribute("aria-expanded", String(isExpanded));

        const titleRow = document.createElement("div");
        titleRow.className = "archive-card-title-row";

        const titleEl = document.createElement("h3");
        titleEl.className = "task-title";
        appendHighlightedText(titleEl, task.title, state.archiveQuery);

        const chevron = document.createElement("span");
        chevron.className = "archive-chevron";
        chevron.setAttribute("aria-hidden", "true");
        chevron.innerHTML = ICONS.chevronDown;

        titleRow.append(titleEl, chevron);
        summaryBtn.appendChild(titleRow);

        if (task.description && !isExpanded) {
            const descEl = document.createElement("p");
            descEl.className = "task-desc";
            appendHighlightedText(descEl, task.description, state.archiveQuery);
            summaryBtn.appendChild(descEl);
        }

        item.append(top, summaryBtn);

        // Rich Archival Timestamp + Cycle Time + Due Date Strip
        const metaStrip = document.createElement("div");
        metaStrip.className = "archive-meta-strip";

        const archivedTag = document.createElement("span");
        archivedTag.className = "archive-meta-tag";
        archivedTag.title = `Archived: ${formatExactTimestamp(task.archived_at)}`;
        archivedTag.innerHTML = `${ICONS.archive}<span></span>`;
        archivedTag.querySelector("span").textContent = formatArchivedStamp(task.archived_at);
        metaStrip.appendChild(archivedTag);

        if (cycleMs !== null) {
            const cycleTag = document.createElement("span");
            cycleTag.className = "archive-meta-tag";
            cycleTag.title = `Created ${formatExactTimestamp(task.created_at)} → Archived ${formatExactTimestamp(task.archived_at)}`;
            cycleTag.innerHTML = `${ICONS.clock}<span>Cycle ${formatDurationMs(cycleMs)}</span>`;
            metaStrip.appendChild(cycleTag);
        }

        if (dueStatus) {
            const dueTag = document.createElement("span");
            dueTag.className = `archive-meta-tag ${
                dueStatus.onTime ? "archive-meta-tag--ontime" : "archive-meta-tag--late"
            }`;
            dueTag.title = `Due date: ${task.due_date}`;
            dueTag.innerHTML = `${ICONS.calendar}<span>${
                dueStatus.onTime ? `On time · ${dueStatus.shortDue}` : `Past due · ${dueStatus.shortDue}`
            }</span>`;
            metaStrip.appendChild(dueTag);
        }

        item.appendChild(metaStrip);

        // Compact AC / DoD pills when collapsed
        if (!isExpanded) {
            const criteriaRow = createCriteriaPills(task);
            if (criteriaRow) item.appendChild(criteriaRow);
        }

        // Expanded Full Inspection Panel
        if (isExpanded) {
            const details = document.createElement("div");
            details.className = "archive-details";

            if (task.description) {
                const fullDesc = document.createElement("p");
                fullDesc.className = "archive-detail-desc";
                appendHighlightedText(fullDesc, task.description, state.archiveQuery);
                details.appendChild(fullDesc);
            }

            // Full Created / Archived / Due Timeline
            const timeline = document.createElement("div");
            timeline.className = "archive-detail-timeline";
            timeline.innerHTML = `
                <div class="archive-time-cell">
                    <span class="archive-time-label">Created</span>
                    <span class="archive-time-val">${formatExactTimestamp(task.created_at)}</span>
                </div>
                <div class="archive-time-cell">
                    <span class="archive-time-label">Archived</span>
                    <span class="archive-time-val">${formatExactTimestamp(task.archived_at)}</span>
                </div>
            `;
            details.appendChild(timeline);

            // Render Acceptance Criteria & Definition of Done checklists read-only
            const renderReadOnlyChecklist = (heading, rawText) => {
                const parsed = parseChecklist(rawText);
                if (parsed.length === 0) return;
                const sec = document.createElement("div");
                sec.className = "archive-detail-checklist";
                const done = parsed.filter((i) => i.done).length;
                const h4 = document.createElement("h4");
                h4.textContent = `${heading} (${done}/${parsed.length})`;
                const ul = document.createElement("ul");
                ul.className = "archive-readonly-list";
                parsed.forEach((entry) => {
                    const li = document.createElement("li");
                    li.className = `archive-readonly-item${entry.done ? " is-done" : ""}`;
                    const mark = document.createElement("span");
                    mark.className = "archive-readonly-mark";
                    mark.textContent = entry.done ? "✓" : "○";
                    const txt = document.createElement("span");
                    appendHighlightedText(txt, entry.text, state.archiveQuery);
                    li.append(mark, txt);
                    ul.appendChild(li);
                });
                sec.append(h4, ul);
                details.appendChild(sec);
            };

            renderReadOnlyChecklist("Acceptance Criteria", task.acceptance_criteria);
            renderReadOnlyChecklist("Definition of Done", task.definition_of_done);

            item.appendChild(details);
        }

        // Footer: Restore (with column choice when expanded) + Safe Two-Step Delete
        const footer = document.createElement("div");
        footer.className = "archive-card-footer";

        const restoreGroup = document.createElement("div");
        restoreGroup.className = "archive-restore-group";

        if (isExpanded && state.columns.length > 0) {
            const colSelect = document.createElement("select");
            colSelect.className = "archive-restore-select";
            colSelect.setAttribute("aria-label", "Restore to column");
            state.columns.forEach((col) => {
                const opt = document.createElement("option");
                opt.value = String(col.id);
                opt.textContent = col.name;
                if (col.id === task.column_id) opt.selected = true;
                colSelect.appendChild(opt);
            });
            restoreGroup.appendChild(colSelect);
        }

        const restoreBtn = document.createElement("button");
        restoreBtn.type = "button";
        restoreBtn.className = "btn btn-ghost btn-sm";
        restoreBtn.dataset.archiveAction = "restore";
        restoreBtn.innerHTML = `${ICONS.restore}<span>${isExpanded ? "Restore" : "Restore to Done"}</span>`;
        restoreGroup.appendChild(restoreBtn);

        footer.appendChild(restoreGroup);

        if (isConfirmingDelete) {
            const confirmBtn = document.createElement("button");
            confirmBtn.type = "button";
            confirmBtn.className = "archive-confirm-delete";
            confirmBtn.dataset.archiveAction = "confirm-delete";
            confirmBtn.textContent = "Confirm delete";
            footer.appendChild(confirmBtn);
        } else {
            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "card-mini-btn card-mini-btn--danger";
            delBtn.dataset.archiveAction = "delete";
            delBtn.title = "Delete permanently";
            delBtn.setAttribute("aria-label", `Delete ${task.title} permanently`);
            delBtn.innerHTML = ICONS.trash;
            footer.appendChild(delBtn);
        }

        item.appendChild(footer);
        return item;
    }

    function renderArchiveList() {
        dom.archiveList.innerHTML = "";
        const items = getFilteredAndSortedArchive();

        if (items.length === 0) {
            const hasFilter = Boolean(state.archiveQuery) || state.archiveFilter !== "all";
            const empty = document.createElement("div");
            empty.className = "archive-empty";
            empty.innerHTML = `
                <span class="archive-empty-icon">${ICONS.archive}</span>
                <h3>${hasFilter ? "No matching archived cards" : "Archive is empty"}</h3>
                <p>${
                    hasFilter
                        ? "Try clearing your search or switching the archive filter."
                        : "Save completed cards from the Done column here to track completion timestamps and keep your board focused."
                }</p>
            `;
            dom.archiveList.appendChild(empty);
            return;
        }

        // Group chronologically when sorted by newest/oldest; flat list when sorted by priority
        if (state.archiveSort === "priority") {
            items.forEach((task) => dom.archiveList.appendChild(buildArchiveCard(task)));
            return;
        }

        const groups = new Map();
        items.forEach((task) => {
            const label = getArchiveDateGroupLabel(task.archived_at);
            if (!groups.has(label)) groups.set(label, []);
            groups.get(label).push(task);
        });

        groups.forEach((groupTasks, groupLabel) => {
            const section = document.createElement("section");
            section.className = "archive-group";

            const header = document.createElement("div");
            header.className = "archive-group-header";

            const h3 = document.createElement("h3");
            h3.className = "archive-group-title";
            h3.textContent = groupLabel;

            const cnt = document.createElement("span");
            cnt.className = "archive-group-count";
            cnt.textContent = `${groupTasks.length} card${groupTasks.length > 1 ? "s" : ""}`;

            header.append(h3, cnt);
            section.appendChild(header);

            groupTasks.forEach((task) => section.appendChild(buildArchiveCard(task)));
            dom.archiveList.appendChild(section);
        });
    }

    async function openArchiveDrawer() {
        clearDependencyHighlight();
        state.lastFocusedElement = document.activeElement;
        state.archiveQuery = "";
        state.archiveFilter = "all";
        state.archiveSort = "newest";
        state.confirmDeleteArchiveId = null;
        dom.archiveSearchInput.value = "";
        dom.archiveSortSelect.value = "newest";
        dom.archiveTypeFilters
            .querySelectorAll(".archive-pill")
            .forEach((p) => p.classList.toggle("is-active", p.dataset.archiveFilter === "all"));

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
            state.confirmDeleteArchiveId = null;
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

    async function handleRestoreTask(taskId, targetColumnId = null) {
        try {
            const body = targetColumnId ? JSON.stringify({ column_id: targetColumnId }) : "{}";
            const restored = await apiRequest(`/api/tasks/${taskId}/restore`, {
                method: "POST",
                body,
            });
            state.expandedArchiveIds.delete(taskId);
            state.recentlyCreatedTaskId = taskId;
            await refreshBoard();
            if (!dom.archiveDrawerOverlay.hidden) {
                await loadArchiveTasks();
            }
            const colName = getColumnById(restored.column_id)?.name || "board";
            showToast(`Restored card to ${colName}`);
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    async function handleDeleteArchivedTask(taskId) {
        try {
            await apiRequest(`/api/tasks/${taskId}`, { method: "DELETE" });
            state.expandedArchiveIds.delete(taskId);
            state.confirmDeleteArchiveId = null;
            await loadArchiveTasks();
            await refreshBoard();
            showToast("Permanently deleted");
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    // -------------------------------------------------------------------------
    // Floating Popovers (Priority, Due Date, Inline Checklist, Column Menu),
    // One-Click Unblock, Column Settings, Bulk Actions & Command Palette
    // -------------------------------------------------------------------------

    function closeFloatingPopover() {
        dom.floatingPopover.hidden = true;
        dom.floatingPopover.innerHTML = "";
    }

    function openFloatingPopover(anchorEl, buildContent) {
        dom.floatingPopover.innerHTML = "";
        buildContent(dom.floatingPopover);
        dom.floatingPopover.hidden = false;

        const rect = anchorEl.getBoundingClientRect();
        const popRect = dom.floatingPopover.getBoundingClientRect();
        const pad = 10;

        let left = rect.left;
        if (left + popRect.width > window.innerWidth - pad) {
            left = Math.max(pad, window.innerWidth - popRect.width - pad);
        }
        let top = rect.bottom + 6;
        if (top + popRect.height > window.innerHeight - pad) {
            top = Math.max(pad, rect.top - popRect.height - 6);
        }

        dom.floatingPopover.style.left = `${left}px`;
        dom.floatingPopover.style.top = `${top}px`;
    }

    async function patchTaskQuick(taskId, patch, toastMsg = null) {
        try {
            await apiRequest(`/api/tasks/${taskId}`, {
                method: "PATCH",
                body: JSON.stringify(patch),
            });
            await refreshBoard();
            if (toastMsg) {
                showToast(toastMsg);
                announce(toastMsg);
            }
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    async function handleUnblockTask(task) {
        const previousBlockers = [...(task.blocker_ids || [])];
        try {
            await apiRequest(`/api/tasks/${task.id}`, {
                method: "PATCH",
                body: JSON.stringify({ card_type: "task" }),
            });
            clearDependencyHighlight();
            await refreshBoard();
            announce(`Unblocked "${task.title}"`);
            showToast(`Unblocked "${task.title}"`, {
                duration: 5000,
                actionLabel: "Undo",
                onAction: async () => {
                    await patchTaskQuick(
                        task.id,
                        { card_type: "blocked", blocker_ids: previousBlockers },
                        "Restored blocked status"
                    );
                },
            });
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    function openInlinePriorityPopover(task, anchorEl) {
        openFloatingPopover(anchorEl, (pop) => {
            const heading = document.createElement("div");
            heading.className = "popover-heading";
            heading.textContent = "Priority";
            pop.appendChild(heading);

            ["urgent", "high", "medium", "low"].forEach((pri) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `popover-item${task.priority === pri ? " is-active" : ""}`;
                btn.innerHTML = `<span class="popover-item-left"><span class="priority-dot priority-dot--${pri}"></span><span style="text-transform:capitalize;">${pri}</span></span>${
                    task.priority === pri ? ICONS.check : ""
                }`;
                btn.addEventListener("click", () => {
                    closeFloatingPopover();
                    if (task.priority !== pri) {
                        patchTaskQuick(task.id, { priority: pri }, `Priority set to ${pri}`);
                    }
                });
                pop.appendChild(btn);
            });
        });
    }

    function openInlineDuePopover(task, anchorEl) {
        openFloatingPopover(anchorEl, (pop) => {
            const heading = document.createElement("div");
            heading.className = "popover-heading";
            heading.textContent = "Due Date";
            pop.appendChild(heading);

            [
                { label: "Today", value: isoDateOffset(0) },
                { label: "Tomorrow", value: isoDateOffset(1) },
                { label: "In 1 week", value: isoDateOffset(7) },
            ].forEach(({ label, value }) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `popover-item${task.due_date === value ? " is-active" : ""}`;
                btn.textContent = label;
                btn.addEventListener("click", () => {
                    closeFloatingPopover();
                    patchTaskQuick(task.id, { due_date: value }, `Due date set to ${label}`);
                });
                pop.appendChild(btn);
            });

            const wrap = document.createElement("div");
            wrap.className = "popover-date-wrap";
            const input = document.createElement("input");
            input.type = "date";
            input.className = "col-text-input";
            input.value = task.due_date || "";
            input.addEventListener("change", () => {
                closeFloatingPopover();
                patchTaskQuick(task.id, { due_date: input.value || null }, "Due date updated");
            });
            wrap.appendChild(input);
            pop.appendChild(wrap);

            if (task.due_date) {
                const clearBtn = document.createElement("button");
                clearBtn.type = "button";
                clearBtn.className = "popover-item popover-item--danger";
                clearBtn.textContent = "Clear due date";
                clearBtn.addEventListener("click", () => {
                    closeFloatingPopover();
                    patchTaskQuick(task.id, { due_date: null }, "Due date cleared");
                });
                pop.appendChild(clearBtn);
            }
        });
    }

    function openInlineChecklistPopover(task, kind, anchorEl) {
        const isAc = kind === "ac";
        const field = isAc ? "acceptance_criteria" : "definition_of_done";
        const items = parseChecklist(task[field]);

        openFloatingPopover(anchorEl, (pop) => {
            const heading = document.createElement("div");
            heading.className = "popover-heading";
            heading.textContent = isAc ? "Acceptance Criteria" : "Definition of Done";
            pop.appendChild(heading);

            const list = document.createElement("div");
            list.className = "popover-checklist";

            items.forEach((entry) => {
                const row = document.createElement("button");
                row.type = "button";
                row.className = `popover-check-row${entry.done ? " is-done" : ""}`;
                row.innerHTML = `<span class="archive-readonly-mark">${entry.done ? "✓" : "○"}</span><span></span>`;
                row.querySelector("span:last-child").textContent = entry.text;
                row.addEventListener("click", async () => {
                    const prevDone = entry.done;
                    entry.done = !prevDone;
                    row.classList.toggle("is-done", entry.done);
                    row.querySelector(".archive-readonly-mark").textContent = entry.done ? "✓" : "○";
                    const serialized = serializeChecklist(items);
                    const prevSerialized = task[field];
                    task[field] = serialized;

                    // Update the pill badge in place so the popover stays open for multi-check
                    const doneCount = items.filter((i) => i.done).length;
                    const prefix = isAc ? "AC" : "DoD";
                    const pillText = doneCount > 0 ? `${prefix} · ${doneCount}/${items.length}` : `${prefix} · ${items.length}`;
                    const labelSpan = anchorEl.querySelector("span");
                    if (labelSpan) labelSpan.textContent = pillText;
                    if (isAc) {
                        anchorEl.classList.toggle("criteria-pill--dod", doneCount === items.length);
                    }

                    try {
                        await apiRequest(`/api/tasks/${task.id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ [field]: serialized }),
                        });
                        announce(`${prefix}: ${doneCount} of ${items.length} complete`);
                    } catch (err) {
                        entry.done = prevDone;
                        task[field] = prevSerialized;
                        row.classList.toggle("is-done", prevDone);
                        row.querySelector(".archive-readonly-mark").textContent = prevDone ? "✓" : "○";
                        const revertedDone = items.filter((i) => i.done).length;
                        if (labelSpan) {
                            labelSpan.textContent =
                                revertedDone > 0
                                    ? `${prefix} · ${revertedDone}/${items.length}`
                                    : `${prefix} · ${items.length}`;
                        }
                        if (isAc) {
                            anchorEl.classList.toggle("criteria-pill--dod", revertedDone === items.length);
                        }
                        showToast(err.message, { type: "error" });
                    }
                });
                list.appendChild(row);
            });
            pop.appendChild(list);
        });
    }

    function openColumnMenuPopover(column, anchorEl) {
        const curSort = state.columnSorts[column.id] || "manual";
        const coreSlugs = new Set(["backlog", "in_progress", "review", "done"]);

        openFloatingPopover(anchorEl, (pop) => {
            const sortHeading = document.createElement("div");
            sortHeading.className = "popover-heading";
            sortHeading.textContent = "Sort Column";
            pop.appendChild(sortHeading);

            [
                { id: "manual", label: "Manual order" },
                { id: "priority", label: "Highest priority" },
                { id: "due_date", label: "Earliest due date" },
            ].forEach(({ id, label }) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `popover-item${curSort === id ? " is-active" : ""}`;
                btn.innerHTML = `<span>${label}</span>${curSort === id ? ICONS.check : ""}`;
                btn.addEventListener("click", () => {
                    state.columnSorts[column.id] = id;
                    closeFloatingPopover();
                    renderBoard();
                    announce(`Sorted ${column.name} by ${label}`);
                });
                pop.appendChild(btn);
            });

            const div = document.createElement("div");
            div.className = "popover-divider";
            pop.appendChild(div);

            const editColBtn = document.createElement("button");
            editColBtn.type = "button";
            editColBtn.className = "popover-item";
            editColBtn.textContent = "Column settings & WIP limit…";
            editColBtn.addEventListener("click", () => {
                closeFloatingPopover();
                openColumnModal(column);
            });
            pop.appendChild(editColBtn);

            const addColBtn = document.createElement("button");
            addColBtn.type = "button";
            addColBtn.className = "popover-item";
            addColBtn.textContent = "+ Add new column…";
            addColBtn.addEventListener("click", () => {
                closeFloatingPopover();
                openColumnModal(null);
            });
            pop.appendChild(addColBtn);

            if (!coreSlugs.has(column.slug)) {
                const delBtn = document.createElement("button");
                delBtn.type = "button";
                delBtn.className = "popover-item popover-item--danger";
                delBtn.textContent = "Delete column";
                delBtn.addEventListener("click", async () => {
                    closeFloatingPopover();
                    await handleDeleteColumn(column.id);
                });
                pop.appendChild(delBtn);
            }
        });
    }

    function openColumnModal(column = null) {
        dom.columnNameError.hidden = true;
        const coreSlugs = new Set(["backlog", "in_progress", "review", "done"]);

        if (column) {
            dom.columnModalTitle.textContent = "Column Settings";
            dom.columnIdInput.value = String(column.id);
            dom.columnNameInput.value = column.name;
            dom.columnWipInput.value = column.wip_limit ? String(column.wip_limit) : "";
            dom.columnColorInput.value = column.color || "#64748b";
            dom.deleteColumnBtn.hidden = coreSlugs.has(column.slug);
        } else {
            dom.columnModalTitle.textContent = "New Column";
            dom.columnIdInput.value = "";
            dom.columnNameInput.value = "";
            dom.columnWipInput.value = "";
            dom.columnColorInput.value = "#6366f1";
            dom.deleteColumnBtn.hidden = true;
        }

        dom.colorSwatches.querySelectorAll(".swatch").forEach((s) => {
            s.classList.toggle("is-selected", s.dataset.color === dom.columnColorInput.value);
        });

        dom.columnModalOverlay.hidden = false;
        dom.columnModalOverlay.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() => dom.columnNameInput.focus());
    }

    function closeColumnModal() {
        dom.columnModalOverlay.hidden = true;
        dom.columnModalOverlay.setAttribute("aria-hidden", "true");
    }

    async function handleSaveColumn(event) {
        event.preventDefault();
        const name = dom.columnNameInput.value.trim();
        if (!name) {
            dom.columnNameError.textContent = "Please enter a column name.";
            dom.columnNameError.hidden = false;
            dom.columnNameInput.focus();
            return;
        }
        dom.columnNameError.hidden = true;

        const rawWip = dom.columnWipInput.value.trim();
        const wip_limit = rawWip ? Number(rawWip) : null;
        const payload = { name, color: dom.columnColorInput.value, wip_limit };
        const editingId = dom.columnIdInput.value ? Number(dom.columnIdInput.value) : null;

        try {
            if (editingId) {
                await apiRequest(`/api/columns/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                showToast(`Updated column "${name}"`);
            } else {
                await apiRequest("/api/columns", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                showToast(`Added column "${name}"`);
            }
            closeColumnModal();
            await refreshBoard();
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    async function handleDeleteColumn(columnId) {
        try {
            await apiRequest(`/api/columns/${columnId}`, { method: "DELETE" });
            closeColumnModal();
            await refreshBoard();
            showToast("Column deleted");
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    // ---- Bulk Selection & Triage ----

    function syncBulkBar() {
        const count = state.selectedTaskIds.size;
        dom.bulkActionBar.hidden = count === 0;
        if (count === 0) return;

        dom.bulkCountLabel.textContent = `${count} selected`;

        // Populate Move dropdown
        dom.bulkMoveSelect.innerHTML = `<option value="">Move to…</option>`;
        state.columns.forEach((col) => {
            const opt = document.createElement("option");
            opt.value = String(col.id);
            opt.textContent = col.name;
            dom.bulkMoveSelect.appendChild(opt);
        });
        dom.bulkPrioritySelect.value = "";

        // Show Archive button if at least one selected card is in Done
        const selectedTasks = [...state.selectedTaskIds].map(findTask).filter(Boolean);
        dom.bulkArchiveBtn.hidden = !selectedTasks.some(isTaskInDone);
    }

    function clearBulkSelection() {
        if (state.selectedTaskIds.size === 0) return;
        state.selectedTaskIds.clear();
        renderBoard();
    }

    async function handleBulkMove(targetColId) {
        const ids = [...state.selectedTaskIds];
        if (!ids.length || !targetColId) return;
        try {
            await Promise.all(
                ids.map((id) =>
                    apiRequest(`/api/tasks/${id}/move`, {
                        method: "PATCH",
                        body: JSON.stringify({ column_id: targetColId }),
                    })
                )
            );
            state.selectedTaskIds.clear();
            await refreshBoard();
            const colName = getColumnById(targetColId)?.name || "column";
            showToast(`Moved ${ids.length} card${ids.length > 1 ? "s" : ""} to ${colName}`);
            announce(`Moved ${ids.length} cards to ${colName}`);
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    async function handleBulkPriority(priority) {
        const ids = [...state.selectedTaskIds];
        if (!ids.length || !priority) return;
        try {
            await Promise.all(
                ids.map((id) =>
                    apiRequest(`/api/tasks/${id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ priority }),
                    })
                )
            );
            state.selectedTaskIds.clear();
            await refreshBoard();
            showToast(`Updated priority to ${priority} for ${ids.length} cards`);
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    async function handleBulkArchive() {
        const doneIds = [...state.selectedTaskIds]
            .map(findTask)
            .filter((t) => t && isTaskInDone(t))
            .map((t) => t.id);
        if (!doneIds.length) return;
        try {
            await Promise.all(
                doneIds.map((id) => apiRequest(`/api/tasks/${id}/archive`, { method: "POST" }))
            );
            state.selectedTaskIds.clear();
            await refreshBoard();
            showToast(`Archived ${doneIds.length} completed card${doneIds.length > 1 ? "s" : ""}`);
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    async function handleBulkDelete() {
        const ids = [...state.selectedTaskIds];
        if (!ids.length) return;
        try {
            await Promise.all(ids.map((id) => apiRequest(`/api/tasks/${id}`, { method: "DELETE" })));
            state.selectedTaskIds.clear();
            await refreshBoard();
            showToast(`Deleted ${ids.length} card${ids.length > 1 ? "s" : ""}`);
        } catch (err) {
            showToast(err.message, { type: "error" });
        }
    }

    // ---- Command Palette (Cmd/Ctrl + K) ----

    function resetAllFilters() {
        state.filters.query = "";
        state.filters.cardType = "all";
        state.filters.priority = "all";
        dom.searchInput.value = "";
        dom.priorityFilter.value = "all";
        dom.cardTypeFilters
            .querySelectorAll(".chip-btn")
            .forEach((b) => b.classList.toggle("is-active", b.dataset.cardType === "all"));
        renderBoard();
    }

    function openCommandPalette() {
        closeFloatingPopover();
        state.lastFocusedElement = document.activeElement;
        dom.cmdPaletteInput.value = "";
        state.cmdSelectedIndex = 0;
        renderCommandPalette("");
        dom.cmdPaletteOverlay.hidden = false;
        dom.cmdPaletteOverlay.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() => dom.cmdPaletteInput.focus());
    }

    function closeCommandPalette() {
        if (dom.cmdPaletteOverlay.hidden) return;
        dom.cmdPaletteOverlay.hidden = true;
        dom.cmdPaletteOverlay.setAttribute("aria-hidden", "true");
        if (state.lastFocusedElement && document.contains(state.lastFocusedElement)) {
            state.lastFocusedElement.focus();
        }
    }

    function renderCommandPalette(rawQuery) {
        const q = rawQuery.trim().toLowerCase();
        const actions = [
            { group: "Actions", title: "Create new card", meta: "N", run: () => openTaskModal() },
            { group: "Actions", title: "Open Archive drawer", meta: "A", run: () => openArchiveDrawer() },
            { group: "Actions", title: "Archive all Done cards", meta: "Done", run: () => handleArchiveAllDone() },
            { group: "Actions", title: "Add new column", meta: "Board", run: () => openColumnModal(null) },
            { group: "Actions", title: "Toggle Dark / Light theme", meta: "Theme", run: () => toggleTheme() },
            {
                group: "Filters",
                title: "Show only Blocked cards",
                meta: "Filter",
                run: () => {
                    state.filters.cardType = "blocked";
                    dom.cardTypeFilters
                        .querySelectorAll(".chip-btn")
                        .forEach((b) => b.classList.toggle("is-active", b.dataset.cardType === "blocked"));
                    renderBoard();
                },
            },
            {
                group: "Filters",
                title: "Show only Blocker cards",
                meta: "Filter",
                run: () => {
                    state.filters.cardType = "blocker";
                    dom.cardTypeFilters
                        .querySelectorAll(".chip-btn")
                        .forEach((b) => b.classList.toggle("is-active", b.dataset.cardType === "blocker"));
                    renderBoard();
                },
            },
            { group: "Filters", title: "Reset all board filters", meta: "Filter", run: () => resetAllFilters() },
            {
                group: "Navigation",
                title: "Open OpenAPI / Swagger Docs",
                meta: "/docs",
                run: () => {
                    window.location.href = "/docs";
                },
            },
        ];

        const matchedActions = q
            ? actions.filter((a) => `${a.title} ${a.group}`.toLowerCase().includes(q))
            : actions;

        const matchedCards = getAllTasks()
            .filter((t) => !q || `${t.title} ${t.description || ""}`.toLowerCase().includes(q))
            .slice(0, q ? 12 : 6)
            .map((t) => ({
                group: "Cards",
                title: t.title,
                meta: getColumnById(t.column_id)?.name || "",
                dotType: t.card_type !== "task" ? t.card_type : null,
                run: () => openTaskModal(t),
            }));

        state.cmdItems = [...matchedActions, ...matchedCards];
        if (state.cmdSelectedIndex >= state.cmdItems.length) state.cmdSelectedIndex = 0;

        dom.cmdPaletteResults.innerHTML = "";
        if (state.cmdItems.length === 0) {
            const empty = document.createElement("div");
            empty.className = "dep-empty";
            empty.textContent = "No matching commands or cards.";
            dom.cmdPaletteResults.appendChild(empty);
            return;
        }

        let currentGroup = null;
        state.cmdItems.forEach((entry, idx) => {
            if (entry.group !== currentGroup) {
                currentGroup = entry.group;
                const lbl = document.createElement("div");
                lbl.className = "cmd-group-label";
                lbl.textContent = currentGroup;
                dom.cmdPaletteResults.appendChild(lbl);
            }

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `cmd-item${idx === state.cmdSelectedIndex ? " is-active" : ""}`;
            btn.setAttribute("role", "option");

            const left = document.createElement("span");
            left.className = "cmd-item-left";
            if (entry.dotType) {
                const dot = document.createElement("span");
                dot.className = `dot dot--${entry.dotType}`;
                left.appendChild(dot);
            }
            const titleSpan = document.createElement("span");
            titleSpan.className = "cmd-item-title";
            titleSpan.textContent = entry.title;
            left.appendChild(titleSpan);

            const meta = document.createElement("span");
            meta.className = "cmd-item-meta";
            meta.textContent = entry.meta;

            btn.append(left, meta);
            btn.addEventListener("mouseenter", () => {
                state.cmdSelectedIndex = idx;
                dom.cmdPaletteResults
                    .querySelectorAll(".cmd-item")
                    .forEach((el, i) => el.classList.toggle("is-active", i === idx));
            });
            btn.addEventListener("click", () => {
                closeCommandPalette();
                entry.run();
            });
            dom.cmdPaletteResults.appendChild(btn);
        });
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
        dom.archiveSortSelect.addEventListener("change", () => {
            state.archiveSort = dom.archiveSortSelect.value;
            renderArchiveList();
        });
        dom.archiveTypeFilters.addEventListener("click", (event) => {
            const pill = event.target.closest(".archive-pill");
            if (!pill) return;
            state.archiveFilter = pill.dataset.archiveFilter;
            dom.archiveTypeFilters
                .querySelectorAll(".archive-pill")
                .forEach((p) => p.classList.toggle("is-active", p === pill));
            renderArchiveList();
        });
        dom.archiveList.addEventListener("click", (event) => {
            const btn = event.target.closest("[data-archive-action]");
            if (!btn) return;
            const item = btn.closest(".archive-card");
            if (!item) return;
            const id = Number(item.dataset.archiveId);
            const action = btn.dataset.archiveAction;

            if (action === "toggle-expand") {
                if (state.expandedArchiveIds.has(id)) state.expandedArchiveIds.delete(id);
                else state.expandedArchiveIds.add(id);
                renderArchiveList();
            } else if (action === "restore") {
                const colSelect = item.querySelector(".archive-restore-select");
                const targetColId = colSelect ? Number(colSelect.value) : null;
                handleRestoreTask(id, targetColId);
            } else if (action === "delete") {
                state.confirmDeleteArchiveId = id;
                renderArchiveList();
                setTimeout(() => {
                    if (state.confirmDeleteArchiveId === id) {
                        state.confirmDeleteArchiveId = null;
                        renderArchiveList();
                    }
                }, 3500);
            } else if (action === "confirm-delete") {
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

        dom.resetFiltersBtn.addEventListener("click", resetAllFilters);

        // Mobile single-column tabs
        dom.mobileColTabs.addEventListener("click", (event) => {
            const btn = event.target.closest("[data-mobile-col-id]");
            if (!btn) return;
            state.activeMobileColumnId = Number(btn.dataset.mobileColId);
            syncMobileTabs();
        });

        // Bulk selection triage controls
        dom.bulkMoveSelect.addEventListener("change", () => {
            if (dom.bulkMoveSelect.value) handleBulkMove(Number(dom.bulkMoveSelect.value));
        });
        dom.bulkPrioritySelect.addEventListener("change", () => {
            if (dom.bulkPrioritySelect.value) handleBulkPriority(dom.bulkPrioritySelect.value);
        });
        dom.bulkArchiveBtn.addEventListener("click", handleBulkArchive);
        dom.bulkDeleteBtn.addEventListener("click", handleBulkDelete);
        dom.bulkClearBtn.addEventListener("click", clearBulkSelection);

        // Column Settings modal
        dom.colorSwatches.addEventListener("click", (event) => {
            const swatch = event.target.closest(".swatch");
            if (!swatch) return;
            dom.columnColorInput.value = swatch.dataset.color;
            dom.colorSwatches
                .querySelectorAll(".swatch")
                .forEach((s) => s.classList.toggle("is-selected", s === swatch));
        });
        dom.columnForm.addEventListener("submit", handleSaveColumn);
        dom.closeColumnModalBtn.addEventListener("click", closeColumnModal);
        dom.cancelColumnModalBtn.addEventListener("click", closeColumnModal);
        dom.columnModalOverlay.addEventListener("click", (event) => {
            if (event.target === dom.columnModalOverlay) closeColumnModal();
        });
        dom.deleteColumnBtn.addEventListener("click", () => {
            const id = Number(dom.columnIdInput.value);
            if (id) handleDeleteColumn(id);
        });

        // Command Palette events
        dom.cmdPaletteInput.addEventListener("input", () => {
            state.cmdSelectedIndex = 0;
            renderCommandPalette(dom.cmdPaletteInput.value);
        });
        dom.cmdPaletteInput.addEventListener("keydown", (event) => {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                if (state.cmdItems.length) {
                    state.cmdSelectedIndex = (state.cmdSelectedIndex + 1) % state.cmdItems.length;
                    renderCommandPalette(dom.cmdPaletteInput.value);
                }
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                if (state.cmdItems.length) {
                    state.cmdSelectedIndex =
                        (state.cmdSelectedIndex - 1 + state.cmdItems.length) % state.cmdItems.length;
                    renderCommandPalette(dom.cmdPaletteInput.value);
                }
            } else if (event.key === "Enter") {
                event.preventDefault();
                const selected = state.cmdItems[state.cmdSelectedIndex];
                if (selected) {
                    closeCommandPalette();
                    selected.run();
                }
            }
        });
        dom.cmdPaletteOverlay.addEventListener("click", (event) => {
            if (event.target === dom.cmdPaletteOverlay) closeCommandPalette();
        });

        // Close anchored popover on outside click
        document.addEventListener("click", (event) => {
            if (
                !dom.floatingPopover.hidden &&
                !dom.floatingPopover.contains(event.target) &&
                !event.target.closest("[data-column-menu-id]") &&
                !event.target.closest('[data-action^="inline-"]')
            ) {
                closeFloatingPopover();
            }
        });

        // Board clicks
        dom.boardGrid.addEventListener("click", (event) => {
            const colMenuBtn = event.target.closest("[data-column-menu-id]");
            if (colMenuBtn) {
                const col = getColumnById(Number(colMenuBtn.dataset.columnMenuId));
                if (col) openColumnMenuPopover(col, colMenuBtn);
                return;
            }

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
                } else if (action === "quick-unblock") {
                    handleUnblockTask(task);
                } else if (action === "inline-priority") {
                    openInlinePriorityPopover(task, actionBtn);
                } else if (action === "inline-due") {
                    openInlineDuePopover(task, actionBtn);
                } else if (action === "inline-ac") {
                    openInlineChecklistPopover(task, "ac", actionBtn);
                } else if (action === "inline-dod") {
                    openInlineChecklistPopover(task, "dod", actionBtn);
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
                const taskId = Number(card.dataset.taskId);
                // Shift+Click or Cmd/Ctrl+Click toggles bulk multi-select
                if (event.shiftKey || event.metaKey || event.ctrlKey) {
                    event.preventDefault();
                    if (state.selectedTaskIds.has(taskId)) state.selectedTaskIds.delete(taskId);
                    else state.selectedTaskIds.add(taskId);
                    renderBoard();
                    return;
                }
                const task = findTask(taskId);
                if (task) openTaskModal(task);
                return;
            }

            // Clicking empty board space unpins spotlight & clears bulk selection
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
        dom.closeTaskModalBtn.addEventListener("click", requestCloseTaskModal);
        dom.cancelTaskModalBtn.addEventListener("click", requestCloseTaskModal);
        dom.keepEditingBtn.addEventListener("click", () => setDiscardConfirmation(false));
        dom.confirmDiscardBtn.addEventListener("click", () => closeTaskModal());
        dom.taskModalOverlay.addEventListener("click", (event) => {
            if (event.target === dom.taskModalOverlay) requestCloseTaskModal();
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
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                if (!dom.cmdPaletteOverlay.hidden) closeCommandPalette();
                else openCommandPalette();
                return;
            }

            if (event.key === "Escape") {
                if (!dom.floatingPopover.hidden) {
                    closeFloatingPopover();
                } else if (!dom.cmdPaletteOverlay.hidden) {
                    closeCommandPalette();
                } else if (!dom.columnModalOverlay.hidden) {
                    closeColumnModal();
                } else if (!dom.taskModalOverlay.hidden) {
                    requestCloseTaskModal();
                } else if (!dom.archiveDrawerOverlay.hidden) {
                    closeArchiveDrawer();
                } else if (state.selectedTaskIds.size > 0) {
                    clearBulkSelection();
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
                !dom.columnModalOverlay.hidden ||
                !dom.cmdPaletteOverlay.hidden ||
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
