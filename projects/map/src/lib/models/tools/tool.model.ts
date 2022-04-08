export interface ToolModel {
  id: string;
  isActive: boolean;
  enable(args: any): void;
  disable(): void;
  destroy(): void;
}
