const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let sourceBox = null;
let mousePos = { x: 0, y: 0 };

// Data storage for blockers per card
const blockersMap = {};

/** Initialize data structure for all cards */
function initBlockerData() {
    document.querySelectorAll('.card').forEach(card => {
        if (!blockersMap[card.id]) {
            blockersMap[card.id] = [];
            renderBlockerList(card);
        }
    });
}

/** Update the UI representation of blockers for a specific card */
function renderBlockerList(card) {
    const container = card.querySelector('.blocker-list');
    if (!container) return;
    
    const list = blockersMap[card.id];
    if (!list) return;

    container.innerHTML = list.length === 0 
        ? '<p style="font-size: 0.7rem; color: #999;">No blockers added.</p>' 
        : list.map((item, index) => `
            <div class="blocker-entry" style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid #eee; font-size: 0.8rem;">
                <span>${item}</span>
                <span class="remove-blocker" style="cursor: pointer; color: #dc3545; margin-left: 10px; font-weight: bold;">[x]</span>
            </div>
        `).join('');
    
    // Add click listeners specifically to the removal buttons
    container.querySelectorAll('.remove-blocker').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Find the correct item to remove by checking which one corresponds to this specific entry
            // Since we're iterating through a map of unique strings, we can find it by current innerText or index
            const parent = btn.parentElement;
            const textSpan = parent.querySelector('span');
            const blockerText = textSpan.innerText.trim();

            // Remove from map
            const index = blockersMap[card.id].indexOf(blockerText);
            if (index !== -1) {
                blockersMap[card.id].splice(index, 1);
                renderBlockerList(card);
            }
        });
    });
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
    if (isDrawing && sourceBox) {
        draw_connection();
    }
});

document.querySelectorAll('.error-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent immediate hit detection on self
        sourceBox = button.closest('.card');
        isDrawing = true;
        renderLoop();
    });
});

// Interaction for adding blockers
window.addEventListener('click', (e) => {
    if (!isDrawing) return;

    const targetElement = e.target.closest('.card');
    
    if (targetElement && targetElement !== sourceBox) {
        const title = targetElement.querySelector('.card-header').innerText;
        const newEntry = `Blocked by: ${title}`;
        
        if (!blockersMap[sourceBox.id].includes(newEntry)) {
            blockersMap[sourceBox.id].push(newEntry);
            alert(`Connection established with: ${targetElement.id}`);
            renderBlockerList(sourceBox);
        } else {
            console.log('This blocker was already added.');
        }
        
        stopDisplayingLine();
    } else if (targetElement === sourceBox) {
         // Just refresh? Or do nothing.
    } else {
        stopDisplayingLine();
    }
});

// View switching logic
document.querySelectorAll('.toggle-view-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentCard = button.closest('.card');
        
        // Reset all cards to visible and show their buttons before applying the filter
        document.querySelectorAll('.card').forEach(card => {
            card.style.display = '';
            const btn = card.querySelector('.toggle-view-btn');
            if (btn) btn.style.display = 'inline-block';
        });

        const isFiltering = currentCard.dataset.filterMode === 'true';
        
        if (!isFiltering) {
            const blockers = blockersMap[currentCard.id] || [];
            
            document.querySelectorAll('.card').forEach(otherCard => {
                if (otherCard !== currentCard) {
                    const title = otherCard.querySelector('.card-header').innerText;
                    // Check if this specific card's identity is listed as a blocker for the active card
                    const isBlocked = blockers.some(b => b.toLowerCase().includes(title.toLowerCase()));
                    
                    if (!isBlocked) {
                        // Hide non-blocking cards entirely
                        otherCard.style.display = 'none';
                    } else {
                        // It IS a blocking component, so we keep it visible but hide its buttons
                        // This ensures only one "Show Blockers" button/active interaction remains visible
                        const btn = otherCard.querySelector('.toggle-view-btn');
                        if (btn) btn.style.display = 'none';
                    }
                }
            });
            currentCard.dataset.filterMode = 'true';
            button.textContent = "Hide Blockers";
            button.classList.add('active-view');
        } else {
            // Restore all
            document.querySelectorAll('.card').forEach(card => {
                card.style.display = '';
                const btn = card.querySelector('.toggle-view-btn');
                if (btn) btn.style.display = 'inline-block';
            });
            currentCard.dataset.filterMode = 'false';
            button.textContent = "Show Blockers";
            button.classList.remove('active-view');
        }
    });
});

function draw_connection() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!sourceBox) return;

    const rect = sourceBox.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(mousePos.x, mousePos.y);
    ctx.strokeStyle = 'red';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 3;
    ctx.stroke();
}

function stopDisplayingLine() {
    isDrawing = false;
    sourceBox = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function renderLoop() {
    if (isDrawing && sourceBox) {
        draw_connection();
        requestAnimationFrame(renderLoop);
    }
}

initBlockerData();
