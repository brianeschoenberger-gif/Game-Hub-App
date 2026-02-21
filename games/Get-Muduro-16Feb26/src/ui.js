function formatNumber(value) {
  return Number(value).toFixed(2);
}

export function createUI() {
  const hud = document.createElement("div");
  hud.className = "hud";

  const panel = document.createElement("div");
  panel.className = "hud-panel";

  const objectiveRow = document.createElement("div");
  objectiveRow.className = "hud-row hud-objective";
  objectiveRow.innerHTML = '<span class="hud-label">Objective:</span><span id="hud-objective"></span>';

  const zoneRow = document.createElement("div");
  zoneRow.className = "hud-row hud-zone";
  zoneRow.innerHTML = '<span class="hud-label">Zone:</span><span id="hud-zone">UNASSIGNED</span>';

  const credRow = document.createElement("div");
  credRow.className = "hud-row";
  credRow.innerHTML = '<span class="hud-label">Credibility:</span><span id="hud-cred">35</span>';

  const levRow = document.createElement("div");
  levRow.className = "hud-row";
  levRow.innerHTML = '<span class="hud-label">Leverage:</span><span id="hud-lev">35</span>';

  const calmRow = document.createElement("div");
  calmRow.className = "hud-row";
  calmRow.innerHTML = '<span class="hud-label">Calm:</span><span id="hud-calm">50</span>';

  const tensionRow = document.createElement("div");
  tensionRow.className = "hud-row";
  tensionRow.innerHTML = '<span class="hud-label">Tension:</span><span id="hud-tension">20</span>';

  const intelRow = document.createElement("div");
  intelRow.className = "hud-row";
  intelRow.innerHTML = '<span class="hud-label">Intel:</span><span id="hud-intel">NO</span>';

  const escortedRow = document.createElement("div");
  escortedRow.className = "hud-row";
  escortedRow.innerHTML = '<span class="hud-label">Escorted:</span><span id="hud-escorted">NO</span>';

  panel.appendChild(objectiveRow);
  panel.appendChild(zoneRow);
  panel.appendChild(credRow);
  panel.appendChild(levRow);
  panel.appendChild(calmRow);
  panel.appendChild(tensionRow);
  panel.appendChild(intelRow);
  panel.appendChild(escortedRow);

  const minimapWrap = document.createElement("div");
  minimapWrap.className = "minimap-wrap";

  const minimapTitle = document.createElement("div");
  minimapTitle.className = "minimap-title";
  minimapTitle.textContent = "Minimap [ / ]";

  const minimapCanvas = document.createElement("canvas");
  minimapCanvas.className = "minimap-canvas";
  minimapCanvas.width = 244;
  minimapCanvas.height = 244;

  minimapWrap.appendChild(minimapTitle);
  minimapWrap.appendChild(minimapCanvas);

  const pointerHint = document.createElement("div");
  pointerHint.className = "pointer-hint";
  pointerHint.textContent = "Click to capture mouse";

  const interactPrompt = document.createElement("div");
  interactPrompt.className = "pointer-hint";
  interactPrompt.style.bottom = "62px";
  interactPrompt.style.display = "none";

  const messageToast = document.createElement("div");
  messageToast.className = "pointer-hint";
  messageToast.style.top = "16px";
  messageToast.style.bottom = "auto";
  messageToast.style.opacity = "0";
  messageToast.style.transition = "opacity 120ms linear";

  const debugOverlay = document.createElement("div");
  debugOverlay.className = "debug-overlay";
  debugOverlay.style.display = "none";

  const crosshair = document.createElement("div");
  crosshair.className = "crosshair";

  const endingOverlay = document.createElement("div");
  endingOverlay.className = "overlay";

  const endingCard = document.createElement("div");
  endingCard.className = "overlay-card";

  const endingTitle = document.createElement("div");
  endingTitle.className = "overlay-title";
  endingTitle.textContent = "Transfer Complete";

  const endingBody = document.createElement("div");
  endingBody.className = "overlay-body";

  const restartBtn = document.createElement("button");
  restartBtn.type = "button";
  restartBtn.className = "overlay-btn";
  restartBtn.textContent = "Restart";

  endingCard.appendChild(endingTitle);
  endingCard.appendChild(endingBody);
  endingCard.appendChild(restartBtn);
  endingOverlay.appendChild(endingCard);

  const startOverlay = document.createElement("div");
  startOverlay.className = "overlay";
  startOverlay.style.display = "flex";

  const startCard = document.createElement("div");
  startCard.className = "overlay-card";

  const startTitle = document.createElement("div");
  startTitle.className = "overlay-title";
  startTitle.textContent = "Secure Campus Prototype";

  const startBody = document.createElement("div");
  startBody.className = "overlay-body";
  startBody.textContent =
`Controls
- Click / Mouse: look
- W A S D: move
- Shift: sprint
- Space: jump
- E: interact
- [ / ]: minimap zoom
- \`: debug`;

  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "overlay-btn";
  startBtn.textContent = "Start";

  startCard.appendChild(startTitle);
  startCard.appendChild(startBody);
  startCard.appendChild(startBtn);
  startOverlay.appendChild(startCard);

  const introOverlay = document.createElement("div");
  introOverlay.className = "overlay";

  const introWrap = document.createElement("div");
  introWrap.style.width = "min(980px, 96vw)";
  introWrap.style.display = "grid";
  introWrap.style.gap = "8px";

  const introVideo = document.createElement("video");
  introVideo.style.width = "100%";
  introVideo.style.maxHeight = "86vh";
  introVideo.style.border = "1px solid rgba(93, 119, 146, 0.9)";
  introVideo.style.borderRadius = "8px";
  introVideo.style.background = "#000";
  introVideo.setAttribute("playsinline", "");
  introVideo.preload = "auto";

  const introSkip = document.createElement("button");
  introSkip.type = "button";
  introSkip.className = "overlay-btn";
  introSkip.textContent = "Skip Intro";
  introSkip.style.justifySelf = "end";

  introWrap.appendChild(introVideo);
  introWrap.appendChild(introSkip);
  introOverlay.appendChild(introWrap);

  hud.appendChild(panel);
  hud.appendChild(minimapWrap);
  hud.appendChild(pointerHint);
  hud.appendChild(interactPrompt);
  hud.appendChild(messageToast);
  hud.appendChild(debugOverlay);
  hud.appendChild(crosshair);

  document.body.appendChild(hud);
  document.body.appendChild(endingOverlay);
  document.body.appendChild(startOverlay);
  document.body.appendChild(introOverlay);

  const ctx = minimapCanvas.getContext("2d");

  const objectiveValue = objectiveRow.querySelector("#hud-objective");
  const zoneValue = zoneRow.querySelector("#hud-zone");
  const credValue = credRow.querySelector("#hud-cred");
  const levValue = levRow.querySelector("#hud-lev");
  const calmValue = calmRow.querySelector("#hud-calm");
  const tensionValue = tensionRow.querySelector("#hud-tension");
  const intelValue = intelRow.querySelector("#hud-intel");
  const escortedValue = escortedRow.querySelector("#hud-escorted");

  const ui = {
    _messageTimer: null,
    _minimapZoom: 2.2,
    _minimapAccumulator: 0,
    _debugVisible: false,
    _endingVisible: false,
    _startVisible: true,
    _introVisible: false,
    _onStart: null,
    _onIntroComplete: null,
    _onIntroKeydown: null,

    setZone(name) {
      zoneValue.textContent = name;
    },
    setObjective(text) {
      objectiveValue.textContent = text;
    },
    getObjectiveText() {
      return objectiveValue.textContent;
    },
    setPointerLocked(locked) {
      pointerHint.style.display = locked ? "none" : "block";
      crosshair.style.display = locked ? "block" : "none";
    },
    setInteractPrompt(visible, text = "") {
      interactPrompt.style.display = visible ? "block" : "none";
      if (visible) interactPrompt.textContent = text;
    },
    setMessage(text, timeoutMs = 1200) {
      messageToast.textContent = text;
      messageToast.style.opacity = "1";
      clearTimeout(ui._messageTimer);
      ui._messageTimer = setTimeout(() => {
        messageToast.style.opacity = "0";
      }, timeoutMs);
    },
    setIntel(flag) {
      intelValue.textContent = flag ? "YES" : "NO";
    },
    setEscorted(flag) {
      escortedValue.textContent = flag ? "YES" : "NO";
    },
    setStats(currentState) {
      credValue.textContent = String(currentState.credibility);
      levValue.textContent = String(currentState.leverage);
      calmValue.textContent = String(currentState.calm);
      tensionValue.textContent = String(currentState.tension);
      intelValue.textContent = currentState.intelCollected ? "YES" : "NO";
      escortedValue.textContent = currentState.escorted ? "YES" : "NO";
    },
    setDebugVisible(flag) {
      ui._debugVisible = flag;
      debugOverlay.style.display = flag ? "block" : "none";
    },
    toggleDebug() {
      ui.setDebugVisible(!ui._debugVisible);
    },
    setDebugText(text) {
      debugOverlay.textContent = text;
    },
    updateMinimap(dt, playerPosition, playerYaw, map2d) {
      ui._minimapAccumulator += dt;
      if (ui._minimapAccumulator < 1 / 12) return;
      ui._minimapAccumulator = 0;

      const w = minimapCanvas.width;
      const h = minimapCanvas.height;
      const scale = ui._minimapZoom;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(7, 11, 18, 0.96)";
      ctx.fillRect(0, 0, w, h);

      const centerX = w * 0.5;
      const centerY = h * 0.5;

      const toMap = (x, z) => ({
        x: centerX + (x - playerPosition.x) * scale,
        y: centerY + (z - playerPosition.z) * scale,
      });

      const bMin = toMap(map2d.bounds.minX, map2d.bounds.minZ);
      const bMax = toMap(map2d.bounds.maxX, map2d.bounds.maxZ);
      ctx.strokeStyle = "#6d8cad";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bMin.x, bMin.y, bMax.x - bMin.x, bMax.y - bMin.y);

      ctx.strokeStyle = "#8ea6bf";
      for (const fp of map2d.footprints) {
        const a = toMap(fp.minX, fp.minZ);
        const b = toMap(fp.maxX, fp.maxZ);
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      }

      for (const marker of map2d.markers) {
        const m = toMap(marker.x, marker.z);
        ctx.fillStyle = marker.kind === "terminal" ? "#7fe6ff" : marker.kind === "g" ? "#ffd071" : "#ff8f8f";
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2.7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#f95f5f";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#fcd7d7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX - Math.sin(playerYaw) * 12, centerY - Math.cos(playerYaw) * 12);
      ctx.stroke();

      ctx.fillStyle = "#c7d9ec";
      ctx.font = "11px Segoe UI";
      ctx.fillText(`Zoom ${formatNumber(ui._minimapZoom)}x`, 8, 14);
    },
    showEnding(data, onRestart) {
      const routeText = data.route;
      endingBody.textContent =
`Route: ${routeText}
Intel collected: ${data.intelCollected ? "YES" : "NO"}

Final Stats
Credibility: ${data.credibility}
Leverage: ${data.leverage}
Calm: ${data.calm}
Tension: ${data.tension}

Time: ${data.elapsed}`;

      endingOverlay.style.display = "flex";
      ui._endingVisible = true;
      restartBtn.onclick = onRestart;
      restartBtn.focus();
    },
    hideEnding() {
      endingOverlay.style.display = "none";
      ui._endingVisible = false;
    },
    isEndingVisible() {
      return ui._endingVisible;
    },
    showStart(onStart) {
      startOverlay.style.display = "flex";
      ui._startVisible = true;
      ui._onStart = onStart || null;
      startBtn.focus();
    },
    hideStart() {
      startOverlay.style.display = "none";
      ui._startVisible = false;
    },
    isStartVisible() {
      return ui._startVisible;
    },
    showIntroVideo(src, onComplete) {
      if (!src) {
        if (onComplete) onComplete();
        return;
      }

      ui._introVisible = true;
      ui._onIntroComplete = onComplete || null;

      introVideo.src = src;
      introVideo.currentTime = 0;
      introOverlay.style.display = "flex";
      introSkip.focus();

      const finish = () => {
        if (!ui._introVisible) return;
        ui.hideIntroVideo();
        if (ui._onIntroComplete) {
          const cb = ui._onIntroComplete;
          ui._onIntroComplete = null;
          cb();
        }
      };

      introVideo.onended = finish;
      introSkip.onclick = finish;

      ui._onIntroKeydown = (event) => {
        if (event.code === "Escape" || event.code === "Space") {
          event.preventDefault();
          finish();
        }
      };
      document.addEventListener("keydown", ui._onIntroKeydown);

      const p = introVideo.play();
      if (p && typeof p.then === "function") {
        p.catch(() => {
          introVideo.muted = true;
          introVideo.play().catch(() => {});
        });
      }
    },
    hideIntroVideo() {
      if (!ui._introVisible) return;
      ui._introVisible = false;
      introOverlay.style.display = "none";
      introVideo.pause();
      introVideo.removeAttribute("src");
      introVideo.load();
      introVideo.onended = null;
      introSkip.onclick = null;
      if (ui._onIntroKeydown) {
        document.removeEventListener("keydown", ui._onIntroKeydown);
        ui._onIntroKeydown = null;
      }
    },
    isIntroVideoVisible() {
      return ui._introVisible;
    },
  };

  document.addEventListener("keydown", (event) => {
    if (event.code === "BracketLeft") {
      ui._minimapZoom = Math.max(0.9, ui._minimapZoom - 0.2);
    } else if (event.code === "BracketRight") {
      ui._minimapZoom = Math.min(5.0, ui._minimapZoom + 0.2);
    }
  });

  startBtn.addEventListener("click", (event) => {
    if (ui._onStart) {
      ui._onStart(event);
    }
  });

  return ui;
}
