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
        : list.map(b => `<div style="font-size: 0.8rem; padding: 2px 0; border-bottom: 1px solid #eee;">${b}</div>`).join('');
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
        
        // Reset all other elements to visible before applying filter
        document.querySelectorAll('.card').forEach(card => card.style.display = '');

        // Check if the specific card's displayed blockers are what we want to see
        // We use a simple toggle check on a data-attribute or standard class
        const isFiltering = currentCard.dataset.filterMode === 'true';
        
        if (!isFiltering) {
            const blockers = blockersMap[currentCard.id] || [];
            
            document.querySelectorAll('.card').forEach(otherCard => {
                if (otherCard !== currentCard) {
                    const title = otherCard.querySelector('.card-header').innerText;
                    // If the other card's title isn't in the blocker list of this card, hide it
                    const isBlocked = blockers.some(b => b.toLowerCase().includes(title.toLowerCase()));
                    if (!isBlocked) {
                        otherCard.style.display = 'none';
                    }
                }
            });
            currentCard.dataset.filterMode = 'true';
            button.textContent = "Hide Blockers";
            button.classList.add('active-view');
        } else {
            // Restore all
            document.querySelectorAll('.card').forEach(card => card.style.display = '');
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
