import { View } from 'ol';

export class OpenLayersHelper {

  public static getResolutionAndScale(view: View) {
    // From ImageWMS.getLegendUrl(), for conversion of resolution to scale
    const mpu = view.getProjection()
      ? view.getProjection().getMetersPerUnit()
      : 1;
    const pixelSize = 0.00028;
    const resolution = view.getResolution() || 0;
    const scale = (resolution * (mpu || 1)) / pixelSize;
    return { scale, resolution };
  }

}
