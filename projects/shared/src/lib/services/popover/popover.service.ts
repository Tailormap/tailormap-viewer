import { Injectable, inject } from '@angular/core';
import { ConnectionPositionPair, Overlay, OverlayConfig, PositionStrategy } from '@angular/cdk/overlay';
import { PopoverParamsModel } from './models/popover-params.model';
import { PopoverRef } from './popover-ref';
import { PopoverPositionEnum } from './models/popover-position.enum';
import { OverlayService } from '../overlay/overlay.service';
import { OverlayRef } from '../overlay/overlay-ref';

@Injectable({
  providedIn: 'root',
})
export class PopoverService {
  private overlayService = inject(OverlayService);
  private overlay = inject(Overlay);


  public open<R = any, T = any>(params: PopoverParamsModel<T>): OverlayRef<R, T> {
    const overlayConfig = this.getOverlayConfig(
      params.width,
      params.height,
      params.hasBackdrop,
      this.getOverlayPosition(params.origin, params.position, params.positionOffset),
    );
    return this.overlayService.open(
      params.content,
      params.data,
      overlayConfig,
      (overlay) => {
        return new PopoverRef<R, T>(overlay, params.data, {
          origin: params.origin,
          closeOnClickOutside: params.closeOnClickOutside,
        });
      },
    );
  }

  private getOverlayConfig(
    width: number | string | undefined,
    height: number | string | undefined,
    hasBackdrop: boolean | undefined,
    positionStrategy: PositionStrategy,
  ): OverlayConfig {
    return new OverlayConfig({
      width,
      height,
      hasBackdrop,
      backdropClass: 'popover-backdrop',
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
  }

  private getOverlayPosition(origin: HTMLElement, position?: PopoverPositionEnum, positionOffset?: number): PositionStrategy {
    return this.overlay.position()
      .flexibleConnectedTo(origin)
      .withPositions(PopoverService.getPositions(position, positionOffset))
      .withPush(false);
  }

  private static getPositions(position?: PopoverPositionEnum, positionOffset?: number): ConnectionPositionPair[] {
    if (position === PopoverPositionEnum.BOTTOM_RIGHT_DOWN) {
      return [
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: positionOffset || 0,
        },
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom',
          offsetY: -1 * (positionOffset || 0),
        },
      ];
    }
    if (position === PopoverPositionEnum.BOTTOM_LEFT_DOWN) {
      return [
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetY: positionOffset || 0,
        },
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -1 * (positionOffset || 0),
        },
      ];
    }
    if (position === PopoverPositionEnum.TOP_RIGHT_UP) {
      return [
        {
          originX: 'end',
          originY: 'top',
          overlayX: 'end',
          overlayY: 'bottom',
          offsetY: -1 * (positionOffset || 0),
        },
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: positionOffset || 0,
        },
      ];
    }
    // PopoverPositionEnum.TOP_LEFT_UP is the default value
    return [
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -1 * (positionOffset || 0),
      },
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
        offsetY: positionOffset || 0,
      },
    ];
  }

}
