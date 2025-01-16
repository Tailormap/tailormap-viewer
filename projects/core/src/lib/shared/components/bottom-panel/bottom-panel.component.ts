import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input, DestroyRef } from '@angular/core';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ViewerLayoutService } from '../../../services/viewer-layout/viewer-layout.service';

@Component({
  selector: 'tm-bottom-panel',
  templateUrl: './bottom-panel.component.html',
  styleUrls: ['./bottom-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BottomPanelComponent implements OnInit {

  @Input({ required: true })
  public isVisible$: Observable<boolean> = of(false);

  @Input({ required: true })
  public title$: Observable<string> = of('');

  @Input()
  public initialHeight = 350;

  @Input()
  public set maximized(maximized: boolean) {
    this.isMaximized = maximized;
  }

  @Input()
  public set minimized(minimized: boolean) {
    this.isMinimized = minimized;
  }

  @Output()
  public heightChanged = new EventEmitter<number>();

  @Output()
  public closed = new EventEmitter();

  private heightSubject = new BehaviorSubject(350);

  public isMinimized = false;
  public isMaximized = false;

  constructor(
    private layoutService: ViewerLayoutService,
    private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    this.heightSubject.next(this.initialHeight || 350);
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
    if (this.isMinimized) {
      initialHeight = 0;
    }
    if (this.isMaximized) {
      initialHeight = window.innerHeight;
    }
    this.isMinimized = false;
    this.isMaximized = false;
    const height = initialHeight - changedHeight;
    this.heightSubject.next(height);
    this.heightChanged.emit(height);
  }

  public getHeight() {
    if (this.isMaximized) {
      return '100vh';
    }
    return `${this.heightSubject.value}px`;
  }

  public onMaximizeClick(): void {
    this.isMaximized = !this.isMaximized;
    if (this.isMaximized) {
      this.isMinimized = false;
    }
  }

  public onMinimizeClick(): void {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.isMaximized = false;
    }
  }

  public onCloseClick(): void {
    this.closed.emit();
  }

}
