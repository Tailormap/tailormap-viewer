import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent, tap } from 'rxjs';
import { finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { CssHelper } from '../../helpers';

@Component({
  selector: 'tm-panel-resize',
  templateUrl: './panel-resizer.component.html',
  styleUrls: ['./panel-resizer.component.css'],
})
export class PanelResizerComponent implements OnInit {

  @ViewChild('resizer', { static: true })
  public resizer: ElementRef<HTMLDivElement> | null = null;

  @Input()
  public orientation: 'horizontal' | 'vertical' = 'vertical';

  @Output()
  public positionChanged: EventEmitter<number> = new EventEmitter<number>();

  private position = 0;

  public resizing = false;

  public ngOnInit() {
    if (!this.resizer) {
      return;
    }
    const resizeHandle = this.resizer.nativeElement.querySelector('.resize-handle');
    if (!resizeHandle) {
      return;
    }
    this.createResizingObserver(resizeHandle, [ 'mousedown', 'mousemove', 'mouseup' ]);
    this.createResizingObserver(resizeHandle, [ 'touchstart', 'touchmove', 'touchend' ]);
  }

  private createResizingObserver(resizeHandle: Element, events: [ downEvent: string, moveEvent: string, upEvent: string ]) {
    fromEvent<MouseEvent | TouchEvent>(resizeHandle, events[0])
      .pipe(
        tap(event => event.preventDefault()),
        map((event: MouseEvent | TouchEvent) => {
          if (this.orientation === 'horizontal') {
            return this.getPageXY(event, 'pageX');
          }
          return this.getPageXY(event, 'pageY');
        }),
        switchMap((initialPosition: number) => {
          this.startResize();
          return fromEvent<MouseEvent | TouchEvent>(document, events[1])
            .pipe(
              map((event: MouseEvent | TouchEvent) => {
                if (this.orientation === 'horizontal') {
                  return this.getPageXY(event, 'pageX') - initialPosition;
                }
                return this.getPageXY(event, 'pageY') - initialPosition;
              }),
              takeUntil(fromEvent(document, events[2])),
              finalize(() => this.resizeComplete()),
            );
        }),
      )
      .subscribe(result => {
        this.position = result;
        this.updateResizeIndicatorPosition(result);
      });
  }

  private getPageXY(event: MouseEvent | TouchEvent, prop: 'pageX' | 'pageY'): number {
    if (this.isTouchEvent(event)) {
      return event.touches[0][prop];
    }
    return event[prop];
  }

  private isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
    return (event as TouchEvent).touches !== undefined && (event as TouchEvent).touches.length > 0;
  }

  private startResize() {
    if (!this.resizer) {
      return;
    }
    this.resizing = true;
    this.position = 0;
    this.resizer.nativeElement.classList.add('resize-panel--resizing');
    document.body.classList.add('resize-active');
    this.updateResizeIndicatorPosition(0);
  }

  private resizeComplete() {
    if (!this.resizer) {
      return;
    }
    document.body.classList.remove('resize-active');
    this.resizer.nativeElement.classList.remove('resize-panel--resizing');
    this.positionChanged.emit(this.position);
    this.resizing = false;
  }

  private updateResizeIndicatorPosition(position: number) {
    if (!this.resizer) {
      return;
    }
    CssHelper.setCssVariableValue('--translate-pos', position + 'px', this.resizer.nativeElement);
  }

}
