import { View } from 'ol';
import { Projection } from 'ol/proj';

export class OlMapScaleHelper {

  private static pixelSize = 0.00028;

  public static getResolutionAndScale(view: View) {
    // From ImageWMS.getLegendUrl(), for conversion of resolution to scale
    const mpu = view.getProjection()
      ? view.getProjection().getMetersPerUnit() ?? 1
      : 1;
    const resolution = view.getResolution() || 0;
    const scale = (resolution * mpu) / OlMapScaleHelper.pixelSize;
    return { scale, resolution };
  }

  public static getResolutionForScale(projection: Projection, scale: number): number {
    const mpu = projection.getMetersPerUnit() ?? 1;
    return (scale * OlMapScaleHelper.pixelSize) / mpu;
  }

}
