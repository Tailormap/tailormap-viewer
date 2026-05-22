import { Cartesian3, Cartographic, Cesium3DTileFeature, Math, PostProcessStage, Scene } from 'cesium';
import { Selection3dModel } from '../../models/selection3d.model';
import { Observable, Subject } from 'rxjs';
import { AttributeType } from '@tailormap-viewer/api';
import { ColorHelper } from '@tailormap-viewer/shared';
import { CoordinateHelper } from '../../helpers/coordinate.helper';

export class CesiumEventManager {

  private static map3DClickEvent: Subject<Selection3dModel> = new Subject<Selection3dModel>();

  public static initClickEvent(
    scene3D: Scene,
    silhouetteColor: string,
    getLayerId: (index: number) => string | null,
    projection2D?: string,
  ) {
    const cesiumEventHandler = new Cesium.ScreenSpaceEventHandler(scene3D.canvas);
    const silhouette = this.createSilhouette(silhouetteColor, 0.01);
    scene3D.postProcessStages.add(Cesium.PostProcessStageLibrary.createSilhouetteStage([silhouette]));

    cesiumEventHandler.setInputAction((movement: any) => {
      const pickedFeature: Cesium3DTileFeature | unknown = scene3D.pick(movement.position);
      const positionEarthCentered: Cartesian3 = scene3D.pickPosition(movement.position);
      const cartographicPosition: Cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(positionEarthCentered);
      let position: { x: number; y: number; z: number };

      if (projection2D) {
        const coordinatesInProjection = CoordinateHelper.projectCoordinates(
          [ cartographicPosition.longitude * 180 / Math.PI, cartographicPosition.latitude * 180 / Math.PI ],
          '+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs',
          projection2D,
        );
        position = { x: coordinatesInProjection[0], y: coordinatesInProjection[1], z: cartographicPosition.height };
      } else {
        const projection = new Cesium.WebMercatorProjection;
        position = projection.project(cartographicPosition);
      }
      if (!CesiumEventManager.isCesium3DTileFeature(pickedFeature)) {
        silhouette.selected = [];
        CesiumEventManager.map3DClickEvent.next({ position: position, mouseCoordinates: movement.position });
      } else {
        let primitiveIndex: number = -1;
        for (let index = 0; index < scene3D.primitives.length; index++) {
          if (pickedFeature.primitive === scene3D.primitives.get(index)) {
            primitiveIndex = index;
          }
        }
        const layerId = getLayerId(primitiveIndex) || '';

        silhouette.selected = [pickedFeature];
        const selection3D: Selection3dModel = {
          position: position,
          mouseCoordinates: movement.position,
          featureInfo: {
            layerId: layerId,
            columnMetadata: [],
            featureId: pickedFeature.featureId,
            properties: [],
            primitiveIndex: primitiveIndex,
          },
        };
        const propertyIds = pickedFeature.getPropertyIds();
        for (const propertyId of propertyIds) {
          selection3D.featureInfo?.properties.push({ id: propertyId, value: pickedFeature.getProperty(propertyId) });
          selection3D.featureInfo?.columnMetadata.push({ layerId: layerId, name: propertyId, type: AttributeType.STRING });
        }
        CesiumEventManager.map3DClickEvent.next(selection3D);
      }

      scene3D.requestRender();
      setTimeout(() => {scene3D.requestRender();}, 300);


    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  private static isCesium3DTileFeature(feature: Cesium3DTileFeature | unknown): feature is Cesium3DTileFeature {
    return Cesium.defined(feature) && feature instanceof Cesium.Cesium3DTileFeature;
  }

  public static onMap3dClick$(): Observable<Selection3dModel> {
    return CesiumEventManager.map3DClickEvent.asObservable();
  }

  private static createSilhouette(color: string, length: number): PostProcessStage {
    const rgbColor = ColorHelper.getRgbForColor(color);
    const silhouette: PostProcessStage = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    silhouette.uniforms.color = new Cesium.Color(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255, 1);
    silhouette.uniforms.length = length;
    silhouette.selected = [];
    return silhouette;
  }

  public static enableKeyboardControl(scene3D: Scene): void {
    const canvas = scene3D.canvas;
    if (!canvas) {
      return;
    }
    canvas.setAttribute('tabindex', '0');
    canvas.focus();

    const MOVE_AMOUNT = 100.0;
    const LOOK_AMOUNT = 0.02;

    canvas.addEventListener('keydown', (e: KeyboardEvent) => {
      const camera = scene3D.camera;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (e.shiftKey) {
            camera.lookUp(LOOK_AMOUNT);
          } else {
            camera.moveForward(MOVE_AMOUNT);
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (e.shiftKey) {
            camera.lookDown(LOOK_AMOUNT);
          } else {
            camera.moveBackward(MOVE_AMOUNT);
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (e.shiftKey) {
            camera.lookLeft(LOOK_AMOUNT);
          } else {
            camera.moveLeft(MOVE_AMOUNT);
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (e.shiftKey) {
            camera.lookRight(LOOK_AMOUNT);
          } else {
            camera.moveRight(MOVE_AMOUNT);
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          camera.zoomIn(MOVE_AMOUNT);
          break;
        case '-':
        case '_':
          e.preventDefault();
          camera.zoomOut(MOVE_AMOUNT);
          break;
        default:
          return;
      }
      scene3D.requestRender();
    });
  }

}
