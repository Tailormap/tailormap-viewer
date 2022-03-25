import OlMap from 'ol/Map';
import { Overlay } from 'ol';
import { MapTooltipModel } from '../models/map-tooltip.model';

export class OpenLayersMapTooltip implements MapTooltipModel {

  private static BASE_CLASS = 'ol-tooltip';
  private readonly overlay: Overlay;
  private readonly contentEl: HTMLDivElement;

  constructor(
    private olMap: OlMap,
  ) {
    this.contentEl = document.createElement('div');
    this.contentEl.className = OpenLayersMapTooltip.BASE_CLASS;
    this.overlay = new Overlay({
      element: this.contentEl,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
    });
    this.olMap.addOverlay(this.overlay);
  }

  public show(): MapTooltipModel {
    this.contentEl.classList.remove('ol-tooltip--hidden');
    return this;
  }

  public hide(): MapTooltipModel {
    this.contentEl.classList.add('ol-tooltip--hidden');
    return this;
  }

  public move(coordinates: number[]): MapTooltipModel {
    this.setClassName('ol-tooltip--moving');
    this.overlay.setPosition(coordinates);
    return this;
  }

  public freeze(): MapTooltipModel {
    this.setClassName('ol-tooltip--static');
    this.setOffset([0, -7]);
    return this;
  }

  public destroy(): void {
    if (this.contentEl && this.contentEl.parentElement) {
      this.contentEl.parentElement.removeChild(this.contentEl);
    }
    this.olMap.removeOverlay(this.overlay);
  }

  public setClassName(clsName: string): MapTooltipModel {
    this.contentEl.className = `${OpenLayersMapTooltip.BASE_CLASS} ${clsName}`;
    return this;
  }

  public setContent(content: string | HTMLElement): MapTooltipModel {
    if (content instanceof HTMLElement) {
      while (this.contentEl.firstChild) {
        this.contentEl.removeChild(this.contentEl.firstChild);
      }
      this.contentEl.appendChild(content);
      return this;
    }
    this.contentEl.textContent = content;
    return this;
  }

  public setOffset([offsetLeft, offsetTop]: [number, number]): MapTooltipModel {
    this.overlay.setOffset([offsetLeft, offsetTop]);
    return this;
  }

}
