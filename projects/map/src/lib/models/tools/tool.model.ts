export interface ToolModel {
  isActive: boolean;
  enable(): void;
  disable(): void;
  destroy(): void;
}
