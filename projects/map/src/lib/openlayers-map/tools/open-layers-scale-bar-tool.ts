import { ScaleBarToolModel, ScaleBarToolConfigModel } from '../../models';
import { Map as OlMap } from 'ol';
import { ScaleLine } from 'ol/control';

export class OpenLayersScaleBarTool implements ScaleBarToolModel {

  private control: ScaleLine | null = null;
  private clsName: string | undefined;
  private target: HTMLElement | undefined;

  constructor(
    public id: string,
    private toolConfig: ScaleBarToolConfigModel,
    private olMap: OlMap,
  ) {}

  public isActive = false;

  public destroy(): void {
    this.disable();
  }

  public disable(): void {
    if (this.control) {
      this.olMap.removeControl(this.control);
      this.control = null;
    }
    this.isActive = false;
  }

  public enable(): void {
    this.replaceControl(this.createControl());
    this.isActive = true;
  }

  public setClass(clsName: string) {
    this.clsName = clsName;
    this.replaceControl(this.createControl(clsName));
  }

  public setTarget(target: HTMLElement) {
    this.target = target;
    this.replaceControl(this.createControl(undefined, target));
  }

  private replaceControl(control: ScaleLine) {
    if (this.control) {
      this.olMap.removeControl(this.control);
    }
    this.control = control;
    this.olMap.addControl(this.control);
  }

  private createControl(clsName?: string, target?: HTMLElement) {
    return new ScaleLine({
      bar: this.toolConfig.scaleType === 'bar',
      className: clsName || this.clsName,
      target: target || this.target,
      minWidth: 100,
    });
  }

}
