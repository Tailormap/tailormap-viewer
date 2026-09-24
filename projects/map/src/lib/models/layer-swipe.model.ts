export interface LayerSwipeModel {
  /** Ids of the layers (background or foreground) to clip. */
  layerIds: string[];
  /**
   * Horizontal position of the swipe line as a fraction of the map width: 0 is the left edge, 1 the
   * right edge. The layers are only drawn left of this line.
   */
  position: number;
}
