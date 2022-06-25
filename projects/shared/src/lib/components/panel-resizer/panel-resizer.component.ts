import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { fromEvent } from 'rxjs';
import { finalize, map, switchMap, takeUntil } from 'rxjs/operators';

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

  constructor() {}

  public ngOnInit() {
    if (!this.resizer) {
      return;
    }
    const resizeHandle = this.resizer.nativeElement.querySelector('.resize-handle');
    if (!resizeHandle) {
      return;
    }
    fromEvent<MouseEvent>(resizeHandle, 'mousedown')
      .pipe(
        map((event: MouseEvent) => {
          if (this.orientation === 'horizontal') {
            return event.pageX;
          }
          return event.pageY;
        }),
        switchMap((initialPosition: number) => {
          this.startResize();
          return fromEvent<MouseEvent>(document, 'mousemove')
            .pipe(
              map((event: MouseEvent) => {
                if (this.orientation === 'horizontal') {
                  return event.pageX - initialPosition;
                }
                return event.pageY - initialPosition;
              }),
              takeUntil(fromEvent(document, 'mouseup')),
              finalize(() => this.resizeComplete()),
            );
        }),
      )
      .subscribe(result => {
        this.position = result;
        this.updateResizeIndicatorPosition(result);
      });
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
    this.resizer.nativeElement.style.setProperty('--translate-pos', position + 'px');
  }

}
