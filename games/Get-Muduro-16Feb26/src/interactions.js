export class InteractionSystem {
  constructor(ui) {
    this.ui = ui;
    this.interactables = [];
    this.activeInteractable = null;
    this.enabled = true;
  }

  setEnabled(flag) {
    this.enabled = flag;
    if (!flag) {
      this.activeInteractable = null;
      this.ui.setInteractPrompt(false, "");
    }
  }

  register(interactable) {
    this.interactables.push(interactable);
  }

  update(playerPosition) {
    if (!this.enabled) {
      this.ui.setInteractPrompt(false, "");
      return;
    }

    let nearest = null;
    let nearestDist = Infinity;

    for (const interactable of this.interactables) {
      if (interactable.enabled === false) continue;

      const dx = playerPosition.x - interactable.position.x;
      const dy = playerPosition.y - interactable.position.y;
      const dz = playerPosition.z - interactable.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= interactable.radius && dist < nearestDist) {
        nearest = interactable;
        nearestDist = dist;
      }
    }

    this.activeInteractable = nearest;

    if (nearest) {
      this.ui.setInteractPrompt(true, `E: ${nearest.label}`);
    } else {
      this.ui.setInteractPrompt(false, "");
    }
  }

  handleInteract() {
    if (!this.enabled || !this.activeInteractable) return;
    const message = this.activeInteractable.onInteract?.();
    if (message) {
      this.ui.setMessage(message);
    }
  }
}
