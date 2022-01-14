export interface OpenLayersTool {
  isActive: boolean;
  enable(): void;
  disable(): void;
  destroy(): void;
}
