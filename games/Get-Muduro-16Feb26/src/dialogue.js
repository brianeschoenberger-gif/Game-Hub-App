import { state, applyEffects } from "./state.js";

function createButton(label) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.style.display = "block";
  button.style.width = "100%";
  button.style.margin = "6px 0";
  button.style.padding = "8px 10px";
  button.style.background = "#15202d";
  button.style.color = "#dceaf8";
  button.style.border = "1px solid #3a5167";
  button.style.borderRadius = "6px";
  button.style.textAlign = "left";
  button.style.cursor = "pointer";
  return button;
}

export function buildDialogueSpec(id) {
  if (id === "ic1_gate") {
    return {
      id,
      title: "IC-1 Security Gate",
      speaker: "Gate Officer",
      allowCancel: false,
      startStage: "stage1",
      stages: {
        stage1: {
          npcText: "State your purpose and authorization.",
          choices: [
            { text: "Appeal to protocol and de-escalation.", effects: { calm: 8, credibility: 4, tension: -4 }, outcome: "done" },
            { text: "Assert urgency and chain-of-command.", effects: { leverage: 10, tension: 8, calm: -3 }, outcome: "done" },
            { text: "Offer transparent verification details.", effects: { credibility: 7, calm: 4, tension: -2 }, outcome: "done" },
          ],
        },
      },
    };
  }

  if (id === "ic2_gate") {
    return {
      id,
      title: "IC-2 Security Gate",
      speaker: "Checkpoint Supervisor",
      allowCancel: false,
      startStage: "stage1",
      stages: {
        stage1: {
          npcText: "Clearance is disputed. Convince me this route remains controlled.",
          choices: [
            { text: "Calmly align on safety protocol.", effects: { calm: 7, credibility: 5, tension: -3 }, outcome: "done" },
            { text: "Leverage command pressure for immediate passage.", effects: { leverage: 12, tension: 10, calm: -3 }, outcome: "done" },
            { text: "Propose monitored transit terms.", effects: { credibility: 6, calm: 3, tension: 1 }, outcome: "done" },
          ],
        },
      },
    };
  }

  if (id === "g_suite") {
    const stage2Choices = [
      { text: "Appeal to stability and controlled handover.", effects: { calm: 10, credibility: 6, tension: -5 }, outcome: "resolved" },
      { text: "Press leverage and enforce a hard deadline.", effects: { leverage: 14, tension: 12, calm: -3 }, outcome: "resolved" },
      { text: "Offer reciprocal concessions for access.", effects: { credibility: 5, calm: 4, tension: -2 }, outcome: "resolved" },
    ];

    if (state.intelCollected) {
      stage2Choices.push({
        text: "Reference verified comms log (Intel).",
        effects: { credibility: 15, tension: -10 },
        outcome: "resolved",
      });
    }

    return {
      id,
      title: "Negotiation Suite",
      speaker: "Commander",
      allowCancel: false,
      startStage: "stage1",
      stages: {
        stage1: {
          npcText: "Before access is discussed, establish intent.",
          choices: [
            { text: "Set a calm and cooperative tone.", effects: { calm: 8, tension: -3 }, nextStage: "stage2" },
            { text: "Signal strategic leverage.", effects: { leverage: 8, tension: 6 }, nextStage: "stage2" },
            { text: "Anchor on procedural legitimacy.", effects: { credibility: 7, calm: 2 }, nextStage: "stage2" },
          ],
        },
        stage2: {
          npcText: "Final terms. Make your case.",
          choices: stage2Choices,
        },
      },
    };
  }

  return null;
}

export class DialogueManager {
  constructor(ui) {
    this.ui = ui;
    this._open = false;
    this._spec = null;
    this._currentStageId = null;
    this._onClose = null;

    this._buildDOM();
    this._bindEvents();
  }

  _buildDOM() {
    this.overlay = document.createElement("div");
    this.overlay.style.position = "fixed";
    this.overlay.style.inset = "0";
    this.overlay.style.display = "none";
    this.overlay.style.alignItems = "center";
    this.overlay.style.justifyContent = "center";
    this.overlay.style.background = "rgba(3, 7, 12, 0.72)";
    this.overlay.style.zIndex = "40";

    const card = document.createElement("div");
    card.style.width = "min(720px, 92vw)";
    card.style.background = "#0f1721";
    card.style.border = "1px solid #35506a";
    card.style.borderRadius = "10px";
    card.style.padding = "14px";
    card.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";

    this.header = document.createElement("div");
    this.header.style.fontSize = "20px";
    this.header.style.color = "#d8e9fb";
    this.header.style.marginBottom = "4px";

    this.speaker = document.createElement("div");
    this.speaker.style.fontSize = "12px";
    this.speaker.style.color = "#9fb8d1";
    this.speaker.style.marginBottom = "10px";

    this.text = document.createElement("div");
    this.text.style.color = "#dce7f4";
    this.text.style.lineHeight = "1.45";
    this.text.style.marginBottom = "12px";

    this.stats = document.createElement("div");
    this.stats.style.fontSize = "12px";
    this.stats.style.color = "#b9cee3";
    this.stats.style.marginBottom = "10px";

    this.choices = document.createElement("div");

    card.appendChild(this.header);
    card.appendChild(this.speaker);
    card.appendChild(this.text);
    card.appendChild(this.stats);
    card.appendChild(this.choices);
    this.overlay.appendChild(card);
    document.body.appendChild(this.overlay);
  }

  _bindEvents() {
    document.addEventListener("keydown", (event) => {
      if (!this._open) return;

      if (event.code === "Escape") {
        if (this._spec.allowCancel === true) {
          this.close({ cancelled: true });
        }
        event.preventDefault();
        return;
      }

      if (event.code.startsWith("Digit")) {
        const raw = Number(event.code.replace("Digit", ""));
        const index = raw - 1;
        if (index >= 0 && index < this._currentChoices.length) {
          this._selectChoice(index);
          event.preventDefault();
        }
      }
    });
  }

  isOpen() {
    return this._open;
  }

  _renderStats() {
    this.stats.textContent =
      `Credibility: ${state.credibility}   Leverage: ${state.leverage}   Calm: ${state.calm}   Tension: ${state.tension}`;
  }

  _renderStage() {
    const stage = this._spec.stages[this._currentStageId];
    this.text.textContent = stage.npcText;
    this._renderStats();

    this.choices.innerHTML = "";
    this._currentChoices = stage.choices;

    stage.choices.forEach((choice, index) => {
      const button = createButton(`${index + 1}. ${choice.text}`);
      button.addEventListener("click", () => this._selectChoice(index));
      this.choices.appendChild(button);
    });
  }

  _selectChoice(index) {
    const choice = this._currentChoices[index];
    if (!choice) return;

    applyEffects(choice.effects);

    if (choice.nextStage) {
      this._currentStageId = choice.nextStage;
      this._renderStage();
      return;
    }

    this.close({ outcome: choice.outcome ?? null, choiceIndex: index });
  }

  open(spec, onClose) {
    if (!spec) return;
    this._open = true;
    this._spec = spec;
    this._onClose = onClose;
    this._currentStageId = spec.startStage || Object.keys(spec.stages)[0];

    this.header.textContent = spec.title;
    this.speaker.textContent = spec.speaker ? `Speaker: ${spec.speaker}` : "";
    this.overlay.style.display = "flex";

    document.exitPointerLock();

    this._renderStage();
  }

  close(result = {}) {
    if (!this._open) return;

    const onClose = this._onClose;

    this._open = false;
    this._spec = null;
    this._onClose = null;
    this._currentStageId = null;
    this._currentChoices = [];
    this.overlay.style.display = "none";

    if (onClose) {
      onClose(result);
    }
  }
}
