export const assetManifest = {
  proceduralSprites: [
    "hero-adventurer",
    "goblin-scout",
    "goblin-captain",
    "coin-glow",
    "heart-glow",
    "sunstone-key",
    "sword-swing",
    "gate-closed",
    "gate-open",
    "treasure-chest",
    "breakable-barrel",
    "breakable-crate",
  ],
  audioCues: [
    "attack",
    "coin",
    "heart",
    "key",
    "enemyHit",
    "playerHit",
    "gateOpen",
    "victory",
    "dash",
  ],
  replacementNotes:
    "Replace procedural texture keys and SoundHooks cue handling with loaded sprite sheets/audio files when final assets are available.",
} as const;
