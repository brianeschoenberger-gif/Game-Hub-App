const defaults = {
  credibility: 35,
  leverage: 35,
  calm: 50,
  tension: 20,
  intelCollected: false,
  escorted: false,
  highTensionEnding: false,
  adminVisited: false,
  gates: {
    ic1Cleared: false,
    ic2Cleared: false,
    holdingAccess: false,
    detourOpen: false,
  },
};

export const state = {
  credibility: defaults.credibility,
  leverage: defaults.leverage,
  calm: defaults.calm,
  tension: defaults.tension,
  intelCollected: defaults.intelCollected,
  escorted: defaults.escorted,
  highTensionEnding: defaults.highTensionEnding,
  adminVisited: defaults.adminVisited,
  gates: {
    ic1Cleared: defaults.gates.ic1Cleared,
    ic2Cleared: defaults.gates.ic2Cleared,
    holdingAccess: defaults.gates.holdingAccess,
    detourOpen: defaults.gates.detourOpen,
  },
};

const STAT_KEYS = ["credibility", "leverage", "calm", "tension"];

export function clampStat(value) {
  return Math.max(0, Math.min(100, value));
}

export function applyEffects(effects = {}) {
  for (const key of STAT_KEYS) {
    if (typeof effects[key] === "number") {
      state[key] = clampStat(state[key] + effects[key]);
    }
  }
}

export function resetState() {
  state.credibility = defaults.credibility;
  state.leverage = defaults.leverage;
  state.calm = defaults.calm;
  state.tension = defaults.tension;
  state.intelCollected = defaults.intelCollected;
  state.escorted = defaults.escorted;
  state.highTensionEnding = defaults.highTensionEnding;
  state.adminVisited = defaults.adminVisited;

  state.gates.ic1Cleared = defaults.gates.ic1Cleared;
  state.gates.ic2Cleared = defaults.gates.ic2Cleared;
  state.gates.holdingAccess = defaults.gates.holdingAccess;
  state.gates.detourOpen = defaults.gates.detourOpen;
}
