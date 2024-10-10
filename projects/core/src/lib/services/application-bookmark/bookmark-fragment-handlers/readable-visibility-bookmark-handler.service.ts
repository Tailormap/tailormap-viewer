import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BookmarkService } from '../../bookmark/bookmark.service';
import { ApplicationBookmarkFragments } from '../application-bookmark-fragments';
import {
  selectLayersWithServices, selectLoadStatus, selectOrderedBackgroundLayerIds,
} from '../../../map/state/map.selectors';
import { filter, take } from 'rxjs';
import { LoadingStateEnum, SnackBarMessageComponent } from '@tailormap-viewer/shared';
import { withLatestFrom } from 'rxjs/operators';
import { setLayerVisibility } from '../../../map/state/map.actions';
import { BookmarkFragmentHandlerServiceModel } from './bookmark-fragment-handler-service.model';
import { ExtendedAppLayerModel } from '../../../map/models';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * This bookmark handler reads the layers part of the bookmark when starting the application only. Does not respond to changes afterward.
 *
 * Format is layers:only=service_title/layername
 * Support for multiple combinations, separated with semicolon: layers:only=service_title/layername;other_service=other_layer
 * Support for multiple layers per service with comma in layer list: layers:only=service_title/layername,layer2
 *
 * Future idea:
 * Replace the current protobuf layer visibility changes url into something readable by combining these functions
 * For example
 * layers:only=service_title/layername;c=service_title/layername:0|1@50...
 */

@Injectable({
  providedIn: 'root',
})
export class ReadableVisibilityBookmarkHandlerService implements BookmarkFragmentHandlerServiceModel {

  private static PART_SEPARATOR = ';';
  private static SERVICE_LAYER_SEPARATOR = '/';
  private static LAYER_SEPARATOR = ',';

  constructor(
    private store$: Store,
    private bookmarkService: BookmarkService,
    private snackbar: MatSnackBar,
  ) {
  }

  public updateBookmarkOnMapChanges() {
  }

  public updateMapOnBookmarkChanges() {
    this.handleExclusiveLayersInBookmark();
  }

  private handleExclusiveLayersInBookmark() {
    const bookmarkFragment$ = this.bookmarkService.registerFragment$(ApplicationBookmarkFragments.READABLE_VISIBILITY_BOOKMARK_DESCRIPTOR)
      .pipe(take(1));
    this.store$.select(selectLoadStatus)
      .pipe(
        filter(loadStatus => loadStatus === LoadingStateEnum.LOADED),
        take(1),
        withLatestFrom(
          bookmarkFragment$,
          this.store$.select(selectLayersWithServices),
          this.store$.select(selectOrderedBackgroundLayerIds),
        ),
      )
      .subscribe(([ _loadStatus, bookmark, layers, backgroundLayerIds ]) => {
        const visibility = ReadableVisibilityBookmarkHandlerService.getExclusiveVisibilityChangesForBookmark(bookmark, layers, backgroundLayerIds);
        if (visibility) {
          if (visibility.every(v => !v.checked)) {
            // We have the bookmark but did not find any layers, show error message
            SnackBarMessageComponent.open$(this.snackbar, {
              message: $localize `:@@core.bookmark.layer-not-found:Layer is not available`,
              showDuration: true,
              showCloseButton: true,
            });
          }
          this.store$.dispatch(setLayerVisibility({ visibility }));
        }
        // If we extend this visible layers bookmark fragment to also contain changed layers (see future idea on top)
        // then we should only remove the only= part and not the rest
        this.bookmarkService.updateFragment(ApplicationBookmarkFragments.READABLE_VISIBILITY_BOOKMARK_DESCRIPTOR, '');
      });
  }

  public static getExclusiveVisibilityChangesForBookmark(
    bookmark: string,
    layers: ExtendedAppLayerModel[],
    backgroundLayerIds: string[],
  ): Array<{ id: string; checked: boolean }> | null {
    if (!bookmark) {
      return null;
    }
    const exclusiveLayersPart = bookmark.replace('only=', '');
    const serviceLayerParts = exclusiveLayersPart.split(ReadableVisibilityBookmarkHandlerService.PART_SEPARATOR);
    const enabledLayers = new Set<string>();
    serviceLayerParts.forEach(serviceLayerPart => {
      const splitIdx = serviceLayerPart.lastIndexOf(ReadableVisibilityBookmarkHandlerService.SERVICE_LAYER_SEPARATOR);
      if (splitIdx === -1) {
        return;
      }
      const serviceName = serviceLayerPart.substring(0, splitIdx);
      const layerNamesPart = serviceLayerPart.substring(splitIdx + 1);
      const layerNames = new Set(layerNamesPart.split(ReadableVisibilityBookmarkHandlerService.LAYER_SEPARATOR));
      layers
        .filter(l => {
          return l.service?.title === serviceName && layerNames.has(l.layerName);
        })
        .forEach(foundLayer => {
          enabledLayers.add(foundLayer.id);
        });
    });
    const backgroundLayers = new Set(backgroundLayerIds);
    return layers
      .filter(l => !backgroundLayers.has(l.id))
      .map(l => ({ id: l.id, checked: enabledLayers.has(l.id) }));
  }
}
