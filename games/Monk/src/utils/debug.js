export function setupDebugOverlay() {
  const label = document.createElement('div');
  label.style.position = 'fixed';
  label.style.right = '12px';
  label.style.top = '10px';
  label.style.padding = '4px 8px';
  label.style.fontSize = '12px';
  label.style.background = 'rgba(0,0,0,0.4)';
  label.style.border = '1px solid rgba(255,255,255,0.15)';
  label.style.borderRadius = '4px';
  label.style.color = '#d8dde9';
  label.style.pointerEvents = 'none';
  label.textContent = 'FPS: --';
  document.body.appendChild(label);

  return {
    update(fps) {
      label.textContent = `FPS: ${Math.round(fps)}`;
    }
  };
}
