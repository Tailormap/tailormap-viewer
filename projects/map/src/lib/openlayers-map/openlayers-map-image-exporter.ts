import { MapExportOptions } from '../map-service/map.service';
import { concatMap, from, map, Observable, Subject, take } from 'rxjs';
import { Map as OlMap } from 'ol';
import { Layer as BaseLayer } from 'ol/layer';
import { View } from 'ol';
import { Size } from 'ol/size';
import { ScaleLine } from 'ol/control';
import type html2canvas from 'html2canvas';
import { ExtentHelper } from '../helpers/extent.helper';
import { OpenlayersExtent } from '../models';
import { OpenLayersLayerManager } from './open-layers-layer-manager';
import { NgZone } from '@angular/core';
import { HttpXsrfTokenExtractor } from '@angular/common/http';

export class OpenLayersMapImageExporter {

  /**
   * Export a map image to a data URL using OpenLayers. For image layers specify LayerModels in options.layers: new OpenLayers Layer
   * instances are created and hidpi strategies for tiling layers used when the requested image resolution is high. For VectorLayers
   * use existing OpenLayers Layer instances in the options.olLayers.
   */
  public static exportMapImage$(
    olSize: Size,
    olView: View,
    options: MapExportOptions,
    extraLayers: BaseLayer[],
    ngZone: NgZone,
    httpXsrfTokenExtractor: HttpXsrfTokenExtractor,
  ): Observable<string> {
    const viewResolution = olView.getResolution();
    if (!olSize || !viewResolution) {
      throw new Error('Map has no size or resolution');
    }

    let exportExtentFactor = 1;
    if (options.extent) {
      // When export extent is specified adjust the imageExportOlSize based on the ratio of the export extent to the extent of the
      // entire olMap, so that it is the width and height in CSS pixels of the preview rectangle on screen. The pixelRatio calculated later
      // allows drawing it on a canvas with 'real' pixels for the final width and height of the exported image with the proper resolution.
      exportExtentFactor = (ExtentHelper.getWidth(options.extent as OpenlayersExtent) / viewResolution) / olSize[0];

      options.center = ExtentHelper.getCenter(options.extent);
    }

    // const extent = olView.calculateExtent(olSize);
    // console.log(`Map image export, OL map size: ${olSize?.[0]} x ${olSize?.[1]} px ` +
    //   `(width/height ratio: ${(olSize?.[0] / olSize?.[1]).toFixed(1)}, ` +
    //   `view resolution: ${viewResolution?.toFixed(3)}, ` +
    //   `extent: ${extent.map(n => n.toFixed(3))}`);

    // Calculate map image size in pixels. Size in mm times resolution converted from inches to mm. 1 inch is 25.4 mm.
    const width = Math.round(options.widthInMm * options.dpi / 25.4);
    const height = Math.round(options.heightInMm * options.dpi / 25.4);
    // console.log(`Map image export, requested size in mm: ${options.widthInMm} x ${options.heightInMm} in ${options.resolution} DPI, ${width} x ${height} px, ` +
    //   `width/height ratio ${(width / height).toFixed(1)}, map center ${options.center}`);

    const imageSize = [ width, height ];
    // The ratio of the export image pixel size to the original map CSS pixel size based on width
    const sizeRatio = imageSize[0] / olSize[0] / exportExtentFactor;
    // When sizeRatio is higher than 1 reduce the map CSS pixel size. We get the higher real pixel density image from the OL canvases
    // because sizeRatio is used as the OL pixelRatio
    const imageExportOlSize = [ imageSize[0]/sizeRatio, imageSize[1]/sizeRatio ];

    const target = document.createElement('div');
    target.style.position = 'absolute';
    target.style.top = '0';
    target.style.left = '0';
    target.style.visibility = 'hidden';
    target.style.width = `${imageExportOlSize[0]}px`;
    target.style.height = `${imageExportOlSize[1]}px`;
    target.style.zIndex = '-10000';
    document.body.append(target);

    const layers = options.layers.map(layer => ({ ...layer, tilePixelRatio: sizeRatio }));
    const backgroundLayers = options.backgroundLayers.map(layer => ({ ...layer, tilePixelRatio: sizeRatio }));

    const scaleLineControl = new ScaleLine({
      units: 'metric',
      bar: true,
      steps: 4,
      minWidth: 80,
    });

    const imageExportOlMap = new OlMap({
      controls: [scaleLineControl],
      interactions: [],
      pixelRatio: sizeRatio,
      view: new View({
        projection: olView.getProjection(),
        resolutions: olView.getResolutions(),
        center: options.center || olView.getCenter(),
        resolution: viewResolution,
      }),
    });

    const manager = new OpenLayersLayerManager(imageExportOlMap, ngZone, httpXsrfTokenExtractor);
    manager.init();
    manager.setBackgroundLayers(backgroundLayers);
    manager.setLayers(layers);
    extraLayers.forEach(l => imageExportOlMap.addLayer(l));

    const renderedMapCanvasDataURL$ = new Subject<string>();
    imageExportOlMap.once('rendercomplete', () => {
      try {
        const imageExportCanvas = document.createElement('canvas');
        imageExportCanvas.width = width;
        imageExportCanvas.height = height;
        const mapContext = imageExportCanvas.getContext('2d');
        if (!mapContext) {
          throw new Error('canvas 2D context is null');
        }
        const layerCanvasList = Array.from((imageExportOlMap.getTarget() as HTMLElement).querySelectorAll<HTMLCanvasElement>('.ol-layer canvas'));
        layerCanvasList.forEach(canvas => {
          OpenLayersMapImageExporter.drawOlCanvasOnImageExportCanvas(canvas, mapContext, width);
        });

        // Render controls using html2canvas
        const scaleBar = imageExportOlMap.getViewport().querySelector('.ol-scale-bar') as HTMLElement;

        // Set element visible otherwise html2canvas won't render it
        target.style.visibility = 'visible';

        from(import('html2canvas'))
          .pipe(
            map(i => i.default),
            concatMap((html2canvasImport: typeof html2canvas) => {
              return from(html2canvasImport(scaleBar, {
                canvas: imageExportCanvas,
                backgroundColor: null,
                logging: false,
                scale: sizeRatio,
                width,
                height,
                x: -16,
                y: -(height / sizeRatio) + 50,
              }));
            }),
            take(1),
          )
          .subscribe(() => {
            renderedMapCanvasDataURL$.next(imageExportCanvas.toDataURL());
            renderedMapCanvasDataURL$.complete();
            manager.destroy();
            imageExportOlMap.dispose();
            document.body.removeChild(target);
          });
      } catch (e) {
        console.error(e);
        renderedMapCanvasDataURL$.error(`Unable to export map canvas to image: ${e}`);
      }
    });

    imageExportOlMap.setTarget(target);

    return renderedMapCanvasDataURL$.asObservable();
  }

  private static drawOlCanvasOnImageExportCanvas(
    olCanvas: HTMLCanvasElement,
    mapExportContext: CanvasRenderingContext2D,
    mapExportWidth: number,
  ) {
    if (olCanvas.width > 0) {
      const opacity = (olCanvas.parentNode as HTMLDivElement).style.opacity;
      mapExportContext.globalAlpha = opacity === '' ? 1 : Number(opacity);

      // An OL canvas will have a CSS transform on it to make it fit the OL target element size. This can reduce a higher pixel density
      // canvas (when pixelRatio > 1) to the CSS pixel size of the OL target element. Draw the original high density canvas to our map
      // export canvas.

      // For tile layers, an OL canvas will have an image with a map resolution of the tile grid and a transform to make it fit the OL
      // target size. For those canvases set a transform on our map export canvas to scale it properly.

      const ratio = mapExportWidth / olCanvas.width;
      mapExportContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      mapExportContext.drawImage(olCanvas, 0, 0);
    }
  }
}
