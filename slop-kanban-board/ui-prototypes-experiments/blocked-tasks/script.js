function showNotification(message) {
  const container = document.getElementById('notification-container');
  if (!container) return;
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  }, 10);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      if (notification.parentNode) {
        container.removeChild(notification);
      }
    }, 500);
  }, 3000);
}

// Application State Management
let canvasEl, ctx;
let isDrawing = false;
let sourceBox = null;
let mousePos = { x: 0, y: 0 };
const blockersMap = {};

/** Core Initialization */
function initBlockerData() {
    document.querySelectorAll('.card').forEach(card => {
        if (!blockersMap[card.id]) {
            blockersMap[card.id] = [];
            renderBlockerList(card);
        }
    });
}

/** Block List Rendering */
function renderBlockerList(card) {
    const container = card.querySelector('.blocker-list');
    if (!container) return;
    
    const list = blockersMap[card.id];
    if (!list) return;

    container.innerHTML = list.length === 0 
        ? '<p style="font-size: 0.7rem; color: #999;">No blockers added.</p>' 
        : list.map(item => `
            <div class="blocker-entry" style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid #eee;">
                <span>${item}</span>
                <span class="remove-blocker" style="cursor: pointer; color: #dc3545; margin-left: 10px; font-weight: bold;">[x]</span>
            </div>
        `).join('');
    
    container.querySelectorAll('.remove-blocker').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const listRef = blockersMap[card.id];
            if (listRef[index]) {
                listRef.splice(index, 1);
                renderBlockerList(card);
            }
        });
    });
}

/** Canvas Management */
function resizeCanvas() {
    if (!canvasEl) return;
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

/** Drawing System */
window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
    if (isDrawing && sourceBox) {
        draw_connection();
    }
});

document.querySelectorAll('.error-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        sourceBox = button.closest('.card');
        isDrawing = true;
        renderLoop();
    });
});

/** Dependency Interaction logic */
window.addEventListener('click', (e) => {
    if (!isDrawing) return;
    
    const targetElement = e.target.closest('.card');
    let connectionEstablished = false;
    // Verify if someone clicked a different valid card
    if (targetElement && targetElement !== sourceBox) {
        const header = targetElement.querySelector('.card-header');
        if (header) {
            const title = header.innerText.trim();
            const newEntry = `Blocked by: ${title}`;
                if (!blockersMap[sourceBox.id].includes(newEntry)) {
                blockersMap[sourceBox.id].push(newEntry);
                showNotification(`Connection established with: ${targetElement.id}`);
                renderBlockerList(sourceBox);
                connectionEstablished = true;
            } else {
                console.log('This blocker was already recorded.');
            }
        } else {
            // Allow interaction even if text is not found, as the intent was to link
            console.log('Accepted card selection for dependency sync.');
        }
    }

    /** Final Execution: Ensure drawing state is cleared regardless of interaction outcome */
    stopDisplayingLine();
});

/** View Logic */
document.querySelectorAll('.toggle-view-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentCard = button.closest('.card');
        
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
                    const isBlocked = blockers.some(b => b.toLowerCase().includes(title.toLowerCase()));
                    
                    if (!isBlocked) {
                        otherCard.style.display = 'none';
                    } else {
                        const btn = otherCard.querySelector('.toggle-view-btn');
                        if (btn) btn.style.display = 'none';
                    }
                }
            });
            currentCard.dataset.filterMode = 'true';
            button.textContent = "Show all tasks";
            button.classList.add('active-view');
        } else {
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

/** Canvas rendering pipeline */
function draw_connection() {
    if (!ctx || !canvasEl) return;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
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
    if (ctx && canvasEl) {
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }
}

function renderLoop() {
    if (isDrawing && sourceBox) {
        draw_connection();
        requestAnimationFrame(renderLoop);
    }
}

// Initialization
initBlockerData();
document.addEventListener('DOMContentLoaded', () => {
    canvasEl = document.getElementById('drawCanvas');
    if (canvasEl) {
        ctx = canvasEl.getContext('2d');
        resizeCanvas();
    }
});
