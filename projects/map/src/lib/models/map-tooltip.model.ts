export interface MapTooltipModel {
  setClassName(clsName: string): MapTooltipModel;
  show(): MapTooltipModel;
  hide(): MapTooltipModel;
  move(coordinates: number[]): MapTooltipModel;
  freeze(): MapTooltipModel;
  setOffset([offsetLeft, offsetTop]: [number, number]): MapTooltipModel;
  setContent(content: string | HTMLElement): MapTooltipModel;
  destroy(): void;
}
