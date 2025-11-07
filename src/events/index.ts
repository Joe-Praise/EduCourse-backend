import { EventEmitter } from "events";

export const appEvents = new EventEmitter();

// Optional: increase listener limit to avoid warnings in dev
appEvents.setMaxListeners(40);