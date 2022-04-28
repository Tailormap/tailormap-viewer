import { ToolModel } from './tool.model';

export interface ScaleBarToolModel extends ToolModel {
  setClass: (clsName: string) => void;
  setTarget: (target: HTMLElement) => void;
}
