import { createUISFX } from "uisfx";

let ui: ReturnType<typeof createUISFX> | null = null;

function getPlayer() {
  if (!ui) {
    ui = createUISFX({ pack: "minimal", volume: 0.55 });
  }
  return ui;
}

let unlocked = false;

export function unlockSfx() {
  if (!unlocked) {
    unlocked = true;
    getPlayer().unlock();
  }
}

export function playSfx(cue: "press" | "check" | "cancel" | "close" | "open" | "select" | "deselect" | "success" | "error" | "warning" | "notification" | "purchase" | "add-to-cart" | "toggle-on" | "toggle-off" | "checkpoint" | "back" | "forward" | "complete" | "level-up") {
  if (!unlocked) return;
  getPlayer().play(cue);
}
