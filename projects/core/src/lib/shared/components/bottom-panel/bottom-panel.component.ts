import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input, DestroyRef } from '@angular/core';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';

@Component({
  selector: 'tm-bottom-panel',
  templateUrl: './bottom-panel.component.html',
  styleUrls: ['./bottom-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomPanelComponent implements OnInit {

  public heightSubject = new BehaviorSubject(350);
  public minimized = false;
  public maximized = false;

  @Input({ required: true })
  public isVisible$: Observable<boolean> = of(false);

  @Input({ required: true })
  public title$: Observable<string> = of('');

  @Output()
  public heightChanged = new EventEmitter<number>();

  @Output()
  public closed = new EventEmitter();

  constructor(
    private layoutService: ViewerLayoutService,
    private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    combineLatest([
      this.isVisible$,
      this.heightSubject.asObservable(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([ visible, height ]) => {
        this.layoutService.setBottomPadding(visible ? height : 0);
      });
  }

  public sizeChanged(changedHeight: number) {
    let initialHeight = this.heightSubject.value;
    if (this.minimized) {
      initialHeight = 0;
    }
    if (this.maximized) {
      initialHeight = window.innerHeight;
    }
    this.minimized = false;
    this.maximized = false;
    const height = initialHeight - changedHeight;
    this.heightSubject.next(height);
    this.heightChanged.emit(height);
  }

  public getHeight() {
    if (this.maximized) {
      return '100vh';
    }
    return `${this.heightSubject.value}px`;
  }

  public onMaximizeClick(): void {
    this.maximized = !this.maximized;
    if (this.maximized) {
      this.minimized = false;
    }
  }

  public onMinimizeClick(): void {
    this.minimized = !this.minimized;
    if (this.minimized) {
      this.maximized = false;
    }
  }

  public onCloseClick(): void {
    this.closed.emit();
  }

}
