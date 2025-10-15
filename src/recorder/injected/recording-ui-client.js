(() => {
  // Check if UI already exists
  if (document.getElementById("__impulse-testing__ui")) {
    return;
  }

  // Create container
  const container = document.createElement("div");
  container.id = "__impulse-testing__ui";
  container.innerHTML = `
    <div id="__impulse-testing__panel">
  <div id="__impulse-testing__drag-handle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.5 24H4.5V18H10.5V24Z" fill="currentColor"/>
<path d="M19.5 24H13.5V18H19.5V24Z" fill="currentColor"/>
<path d="M10.5 15H4.5V9H10.5V15Z" fill="currentColor"/>
<path d="M19.5 15H13.5V9H19.5V15Z" fill="currentColor"/>
<path d="M10.5 6H4.5V0H10.5V6Z" fill="currentColor"/>
<path d="M19.5 6H13.5V0H19.5V6Z" fill="currentColor"/>
</svg>
  </div>
        <button id="__impulse-testing__snapshot-btn" class="__impulse-testing__btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3H5V5H3V3ZM7 3H9V5H7V3ZM11 3H13V5H11V3ZM15 3H17V5H15V3ZM19 3H21V5H19V3ZM19 7H21V9H19V7ZM3 19H5V21H3V19ZM3 15H5V17H3V15ZM3 11H5V13H3V11ZM3 7H5V9H3V7ZM10.6667 11L11.7031 9.4453C11.8886 9.1671 12.2008 9 12.5352 9H15.4648C15.7992 9 16.1114 9.1671 16.2969 9.4453L17.3333 11H20C20.5523 11 21 11.4477 21 12V20C21 20.5523 20.5523 21 20 21H8C7.44772 21 7 20.5523 7 20V12C7 11.4477 7.44772 11 8 11H10.6667ZM9 19H19V13H16.263L14.9296 11H13.0704L11.737 13H9V19ZM14 18C12.8954 18 12 17.1046 12 16C12 14.8954 12.8954 14 14 14C15.1046 14 16 14.8954 16 16C16 17.1046 15.1046 18 14 18Z"></path></svg>
          Checkpoint
        </button>
        <button id="__impulse-testing__stop-btn" class="__impulse-testing__btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5H19V19H5V5ZM4 3C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V4C21 3.44772 20.5523 3 20 3H4Z"></path></svg>
          Stop & Save
        </button>
    </div>
  `;

  // Create and inject styles
  const style = document.createElement("style");
  style.textContent = `
#__impulse-testing__panel {
  position: fixed;
  bottom: 24px;
  left: 50vw;
  transform: translateX(-50%);

  display: flex;
  align-items: center;

  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  background: #c4c4c433;
  border: 1px #c4c4c4dd solid;
  border-radius: 14px;
}

#__impulse-testing__drag-handle {
  height: 40px;
  width: 40px;
  display: grid;
  place-items: center;
  cursor: grab;
}

#__impulse-testing__drag-handle > svg {
  color: #CCC;
  height: 20px;
}

#__impulse-testing__panel > button {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  margin-right: 6px;
  background: white;
  border: none;
  outline: none;
  padding: 4px 12px;
  border-radius: 8px;
  transition: all 200ms ease-in-out;
}

#__impulse-testing__panel > button > svg {
  height: 20px;
  width: 20px;
  flex-shrink: 0;
}

#__impulse-testing__panel > button#__impulse-testing__snapshot-btn:hover {
  background: oklch(68.5% 0.169 237.323);
  color: white;
}

#__impulse-testing__panel > button#__impulse-testing__stop-btn:hover {
  background: oklch(63.7% 0.237 25.331);
  color: white;
}`;

  document.head.appendChild(style);
  document.body.appendChild(container);

  // Add event listeners
  const stopBtn = document.getElementById("__impulse-testing__stop-btn");
  const snapshotBtn = document.getElementById("__impulse-testing__snapshot-btn");

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      window.__impulse_onStop();
    });
  }

  if (snapshotBtn) {
    snapshotBtn.addEventListener("click", () => {
      window.__impulse_onSnapshot();
    });
  }

  // Make the panel draggable
  const panel = document.getElementById("__impulse-testing__panel");
  const dragHandle = document.getElementById("__impulse-testing__drag-handle");

  if (panel && dragHandle) {
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;

    dragHandle.addEventListener("mousedown", (e) => {
      isDragging = true;
      initialX = e.clientX - currentX;
      initialY = e.clientY - currentY;
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      if (panel) {
        panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }
})();
