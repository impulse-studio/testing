// Configuration types (inferred from Zod schemas)

export type { Config } from "./schemas/config-schema.js";
export type { LifecycleCommand } from "./schemas/lifecycle-command-schema.js";

// Story types (manually defined)

export interface StoryStart {
  url: string;
  resolution?: {
    width: number;
    height: number;
  };
  pixelRatio?: number;
  deviceScaleFactor?: number;
}

export interface BaseAction {
  type: string;
}

export interface ClickAction extends BaseAction {
  type: "click";
  selector: string;
}

export interface InputAction extends BaseAction {
  type: "input";
  selector: string;
  value: string;
}

export interface SelectAction extends BaseAction {
  type: "select";
  selector: string;
  value: string;
}

export interface CheckAction extends BaseAction {
  type: "check" | "uncheck";
  selector: string;
}

export interface NavigateAction extends BaseAction {
  type: "navigate";
  url: string;
}

export interface ScreenshotAction extends BaseAction {
  type: "screenshot";
  name: string;
}

export type Action =
  | ClickAction
  | InputAction
  | SelectAction
  | CheckAction
  | NavigateAction
  | ScreenshotAction;

export interface Story {
  id: string;
  name: string;
  start: StoryStart;
  actions: Action[];
}
