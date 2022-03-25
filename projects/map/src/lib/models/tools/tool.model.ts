export interface ToolModel {
  isActive: boolean;
  enable(args: any): void;
  disable(): void;
  destroy(): void;
}
