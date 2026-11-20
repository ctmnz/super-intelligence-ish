# User Guide & UI/UX Features

KanbanFlow is designed around a calm, full-width Kanban board with minimal visual noise and fast keyboard-friendly interactions.

---

## Navigation & Filtering

The single-row frosted topbar gives immediate access to every workspace control:

- **Search (`/`):** Live case-insensitive search across card titles, descriptions, Acceptance Criteria, and Definition of Done, with `<mark>` highlighting on matching text.
- **Card Type Chips:** Filter the board to **All**, **Blocked**, or **Blocker** cards (with live monospace counts when active cards exist).
- **Priority Select:** Filter by `Urgent`, `High`, `Medium`, or `Low`.
- **Reset:** Appears automatically when any filter is active.
- **API Button:** Opens the interactive Swagger UI at `/docs`.
- **Archive Button (`A`):** Opens the slide-over Archive drawer (displays archived card count).
- **Theme Toggle:** Switches smoothly between Light and Dark themes (persisted in `localStorage` and respecting system preference on first visit).
- **New Card (`N`):** Opens the Create Card modal.

---

## Working with Cards

### Creating Cards
- **Quick Add:** Click `+ Add card` at the bottom of any column (or click an empty column area), type a title, and press `Enter`.
- **Full Modal:** Click **New Card** (`N`) or a column's `+` button to configure title, column, priority, due date, card type, dependencies, description, Acceptance Criteria, and Definition of Done.

### Moving & Reordering
- **Drag-and-Drop:** Drag any card to reorder within a column or drop into another column. A dashed ghost drop slot previews the exact landing position, with optimistic instant UI updates.
- **Quick Move:** Hover a card to reveal `←` / `→` arrows to shift it to adjacent columns in one click.

### Editing Cards (Add / Edit Modal)
Click any card (or press `Enter` while focused) to open the Edit Card modal:
- **Dynamic Top Accent:** Top accent stripe reflects card type (indigo = Standard, amber = Blocked, crimson = Blocker).
- **Property Bar:** Inline color-dotted chips for Column, Priority, and Due Date (with a one-click **Today** button and `×` clear button).
- **Interactive Checklists (Acceptance Criteria & Definition of Done):**
  - Type an item and press `Enter` (or paste a multi-line list to split automatically).
  - Click custom SVG checkboxes to check/uncheck items; watch the `done/total` counter and progress micro-bar update live.
  - Click the `done/total` counter pill to toggle all items at once.
  - On an empty **Definition of Done**, click **`+ Template`** to insert standard items (*Tests pass cleanly*, *Code reviewed*, *Documentation updated*).
- **Unsaved Indicator & Shortcuts:** Edit mode shows an amber `Unsaved` pill when modified; press `Cmd/Ctrl + Enter` to save from anywhere in the modal.

### Deleting with Undo
Deleting a card removes it immediately and shows a 5-second **Undo** toast that restores the card, its position, its checklists, and its dependency links.

---

## Blocked & Blocker Visual Spotlight

1. Set a card's type to **Blocked** and select one or more cards under **Blocked by** (or set a card to **Blocker** and select cards under **Blocks these cards**).
2. **Hover a `Blocked` card:**
   - Unrelated cards gently dim.
   - Every active **Blocker** card highlights in a **red frame + glow** with a floating **`Blocker`** badge and animated red curved SVG arrows pointing into the blocked card.
   - Any linked blocker already in **Done** highlights in an **emerald frame** with a **`Resolved`** badge and green dashed connector.
3. **Hover a `Blocker` card:**
   - Every card **blocked by it** highlights in an **amber frame + glow** with a floating **`Blocked by this`** badge and animated curved arrows.
4. **Click-to-Pin:** Click the `Blocked by N` or `Blocks N` pill in a card's footer to pin the spotlight hands-free. Click empty board space, click **Unpin**, or press `Esc` to clear.

---

## Archiving Done Cards

- Hover any card in the **Done** column and click the **Archive** icon (or click **Archive** inside the Edit modal).
- Click **`Archive all`** in the **Done** column header to archive all completed cards at once.
- Open the **Archive** drawer (`A` or topbar button) to search archived cards, **Restore to Done**, or permanently delete them.

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `N` | Open New Card modal |
| `/` | Focus board search input |
| `A` | Open Archive drawer |
| `Cmd/Ctrl + Enter` | Submit active Create / Edit modal |
| `Esc` | Close modal, close Archive drawer, unpin spotlight, or cancel quick-add |
