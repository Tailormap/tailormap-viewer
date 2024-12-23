import {
  Cartesian3, Cartographic, Cesium3DTileFeature, Color as CesiumColor, PostProcessStage, Scene,
} from 'cesium';
import { Selection3dModel } from '../../models/selection3d.model';
import { Observable, Subject } from 'rxjs';


export class CesiumEventManager {

  public static onMap3DClick$(scene3D: Scene): Observable<Selection3dModel> {
    const cesiumEventHandler = new Cesium.ScreenSpaceEventHandler(scene3D.canvas);
    const silhouette = this.createSilhouette(CesiumColor.LIME, 0.01);
    scene3D.postProcessStages.add(Cesium.PostProcessStageLibrary.createSilhouetteStage([silhouette]));

    const map3DClickEvent: Subject<Selection3dModel> = new Subject<Selection3dModel>();

    cesiumEventHandler.setInputAction((movement: any) => {

      const pickedFeature: Cesium3DTileFeature = scene3D.pick(movement.position);
      const positionEarthCentered: Cartesian3 = scene3D.pickPosition(movement.position);
      const cartographicPosition: Cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(positionEarthCentered);
      const projection = new Cesium.WebMercatorProjection;
      const position = projection.project(cartographicPosition);

      if (!Cesium.defined(pickedFeature)) {
        silhouette.selected = [];
        map3DClickEvent.next({ position: position });
      } else {
        silhouette.selected = [pickedFeature];
        const selection3D: Selection3dModel = {
          position: position,
          featureInfo: {
            layerId: '',
            columnMetadata: [],
            featureId: pickedFeature.featureId,
            properties: [],
          },
        };
        const propertyIds = pickedFeature.getPropertyIds();
        for (const propertyId of propertyIds) {
          selection3D.featureInfo?.properties.push({ id: propertyId, value: pickedFeature.getProperty(propertyId) });
        }
        map3DClickEvent.next(selection3D);
      }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return map3DClickEvent.asObservable();
  }

  private static createSilhouette(color: CesiumColor, length: number): PostProcessStage {
    const silhouette: PostProcessStage = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    silhouette.uniforms.color = color;
    silhouette.uniforms.length = length;
    silhouette.selected = [];
    return silhouette;
  }

}
