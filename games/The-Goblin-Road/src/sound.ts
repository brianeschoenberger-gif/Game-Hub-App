export type SoundCue =
  | "attack"
  | "coin"
  | "heart"
  | "key"
  | "enemyHit"
  | "playerHit"
  | "gateOpen"
  | "victory"
  | "dash";

export class SoundHooks {
  private enabled = true;
  private muted = false;
  private context?: AudioContext;

  play(cue: SoundCue): void {
    if (!this.enabled || this.muted) return;

    // Swap this method for real authored audio files later. Keeping the hook
    // centralized makes it easy to replace placeholder bleeps with assets.
    const frequencies: Record<SoundCue, number> = {
      attack: 260,
      coin: 880,
      heart: 620,
      key: 1040,
      enemyHit: 180,
      playerHit: 120,
      gateOpen: 420,
      victory: 720,
      dash: 330,
    };

    try {
      this.context ??= new AudioContext();
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.frequency.value = frequencies[cue];
      oscillator.type = cue === "victory" ? "triangle" : "sine";
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, this.context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.14);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start();
      oscillator.stop(this.context.currentTime + 0.16);
    } catch {
      this.enabled = false;
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }
}
