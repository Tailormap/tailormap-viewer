import { Cartesian3, Cartographic, Cesium3DTileFeature, Math, PostProcessStage, Scene, Camera, Cartesian2 } from 'cesium';
import { Selection3dModel } from '../../models/selection3d.model';
import { Observable, Subject } from 'rxjs';
import { AttributeType } from '@tailormap-viewer/api';
import { ColorHelper } from '@tailormap-viewer/shared';
import { CoordinateHelper } from '../../helpers/coordinate.helper';

export class CesiumEventManager {

  private static map3DClickEvent: Subject<Selection3dModel> = new Subject<Selection3dModel>();

  public static initClickEvent(
    scene3D: Scene,
    silhouette: PostProcessStage | null,
    getLayerId: (index: number) => string | null,
    projection2D?: string,
  ) {
    if (!silhouette) {
      return;
    }
    const cesiumEventHandler = new Cesium.ScreenSpaceEventHandler(scene3D.canvas);
    scene3D.postProcessStages.add(Cesium.PostProcessStageLibrary.createSilhouetteStage([silhouette]));

    cesiumEventHandler.setInputAction((movement: any) => {
      CesiumEventManager.handleClick(scene3D, silhouette, getLayerId, projection2D, movement.position);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  public static simulateCenterClick(
    scene3D: Scene,
    silhouette: PostProcessStage | null,
    getLayerId: (index: number) => string | null,
    projection2D?: string,
  ): void {
    if (!silhouette) {
      return;
    }
    const canvas = scene3D.canvas;
    const centerPosition = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
    CesiumEventManager.handleClick(scene3D, silhouette, getLayerId, projection2D, centerPosition);
  }

  private static handleClick(
    scene3D: Scene,
    silhouette: PostProcessStage,
    getLayerId: (index: number) => string | null,
    projection2D: string | undefined,
    windowPosition: Cartesian2,
  ): void {
    const pickedFeature: Cesium3DTileFeature | unknown = scene3D.pick(windowPosition);
    const positionEarthCentered: Cartesian3 = scene3D.pickPosition(windowPosition);
    const cartographicPosition: Cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(positionEarthCentered);
    let pos: { x: number; y: number; z: number };

    if (projection2D) {
      const coordinatesInProjection = CoordinateHelper.projectCoordinates(
        [ cartographicPosition.longitude * 180 / Math.PI, cartographicPosition.latitude * 180 / Math.PI ],
        '+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs',
        projection2D,
      );
      pos = { x: coordinatesInProjection[0], y: coordinatesInProjection[1], z: cartographicPosition.height };
    } else {
      const projection = new Cesium.WebMercatorProjection;
      pos = projection.project(cartographicPosition);
    }
    if (!CesiumEventManager.isCesium3DTileFeature(pickedFeature)) {
      silhouette.selected = [];
      CesiumEventManager.map3DClickEvent.next({ position: pos, mouseCoordinates: windowPosition });
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
        position: pos,
        mouseCoordinates: windowPosition,
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
    setTimeout(() => { scene3D.requestRender(); }, 300);
  }

  private static isCesium3DTileFeature(feature: Cesium3DTileFeature | unknown): feature is Cesium3DTileFeature {
    return Cesium.defined(feature) && feature instanceof Cesium.Cesium3DTileFeature;
  }

  public static onMap3dClick$(): Observable<Selection3dModel> {
    return CesiumEventManager.map3DClickEvent.asObservable();
  }

  public static createSilhouette(color: string, length: number): PostProcessStage {
    const rgbColor = ColorHelper.getRgbForColor(color);
    const silhouette: PostProcessStage = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    silhouette.uniforms.color = new Cesium.Color(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255, 1);
    silhouette.uniforms.length = length;
    silhouette.selected = [];
    return silhouette;
  }

  public static enableKeyboardControl(scene3D: Scene, element: HTMLElement): void {
    const MOVE_AMOUNT = 50.0;
    const LOOK_AMOUNT = 0.02;

    element.addEventListener('keydown', (e: KeyboardEvent) => {
      const camera = scene3D.camera;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (e.shiftKey) {
            camera.lookUp(LOOK_AMOUNT);
          } else {
            CesiumEventManager.moveForwardHorizontally(camera, MOVE_AMOUNT);          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) {
            camera.lookDown(LOOK_AMOUNT);
          } else {
            CesiumEventManager.moveForwardHorizontally(camera, -MOVE_AMOUNT);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            const surfaceNormal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(camera.position, new Cesium.Cartesian3());
            camera.look(surfaceNormal, -LOOK_AMOUNT);
          } else {
            camera.moveLeft(MOVE_AMOUNT);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            const surfaceNormal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(camera.position, new Cesium.Cartesian3());
            camera.look(surfaceNormal, LOOK_AMOUNT);
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

  private static moveForwardHorizontally(camera: Camera, amount: number): void {
    // Get the horizontal component of the camera direction vector
    const surfaceNormal: Cartesian3 = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(camera.position, new Cesium.Cartesian3());
    const directionDotSurfaceNormal: number = Cesium.Cartesian3.dot(camera.direction, surfaceNormal);
    const verticalComponent: Cartesian3 = Cesium.Cartesian3.multiplyByScalar(surfaceNormal, directionDotSurfaceNormal, new Cesium.Cartesian3());
    const horizontalComponent: Cartesian3 = Cesium.Cartesian3.subtract(camera.direction, verticalComponent, new Cesium.Cartesian3());
    // The horizontal vector needs to be normalized because camera.move multiplies the direction vector by the amount without normalizing it
    const normalizedHorizontalDirection: Cartesian3 = Cesium.Cartesian3.normalize(horizontalComponent, new Cesium.Cartesian3());
    camera.move(normalizedHorizontalDirection, amount);
  }

}
