import { Cartesian3, Cartographic, Cesium3DTileFeature, PostProcessStage, Scene } from 'cesium';
import { Selection3dModel } from '../../models/selection3d.model';
import { Observable, Subject } from 'rxjs';
import { AttributeType } from '@tailormap-viewer/api';
import { ColorHelper } from '@tailormap-viewer/shared';

export class CesiumEventManager {

  public static onMap3DClick$(scene3D: Scene, silhouetteColor: string): Observable<Selection3dModel> {
    const cesiumEventHandler = new Cesium.ScreenSpaceEventHandler(scene3D.canvas);
    const silhouette = this.createSilhouette(silhouetteColor, 0.01);
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
        let primitiveIndex: number = -1;
        for (let index = 0; index < scene3D.primitives.length; index++) {
          if (pickedFeature.primitive === scene3D.primitives.get(index)) {
            primitiveIndex = index;
          }
        }

        silhouette.selected = [pickedFeature];
        const selection3D: Selection3dModel = {
          position: position,
          featureInfo: {
            layerId: '',
            columnMetadata: [],
            featureId: pickedFeature.featureId,
            properties: [],
            primitiveIndex: primitiveIndex,
          },
        };
        const propertyIds = pickedFeature.getPropertyIds();
        for (const propertyId of propertyIds) {
          selection3D.featureInfo?.properties.push({ id: propertyId, value: pickedFeature.getProperty(propertyId) });
          selection3D.featureInfo?.columnMetadata.push({ layerId: '', key: propertyId, type: AttributeType.STRING });
        }
        map3DClickEvent.next(selection3D);
      }

      scene3D.requestRender();
      setTimeout(() => {scene3D.requestRender();}, 300);


    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return map3DClickEvent.asObservable();
  }

  private static createSilhouette(color: string, length: number): PostProcessStage {
    const rgbColor = ColorHelper.getRgbForColor(color);
    const silhouette: PostProcessStage = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    silhouette.uniforms.color = new Cesium.Color(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255, 1);
    silhouette.uniforms.length = length;
    silhouette.selected = [];
    return silhouette;
  }

}
