import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MenubarService } from '../../menubar/menubar.service';
import { BrowserHelper, CssHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-mobile-menubar-panel',
  templateUrl: './mobile-menubar-panel.component.html',
  styleUrls: ['./mobile-menubar-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MobileMenubarPanelComponent implements OnDestroy, OnInit {
  private menubarService = inject(MenubarService);


  public activeComponent$: Observable<{ componentId: string; dialogTitle: string } | null>;
  public dialogTitle$: Observable<string>;
  public isVisible$: Observable<boolean>;

  private heightSubject = new BehaviorSubject(350);

  public isMinimized = false;
  public isMaximized = false;

  constructor() {
    this.activeComponent$ = this.menubarService.getActiveComponent$().pipe(
      debounceTime(0),
    );
    this.dialogTitle$ = this.activeComponent$.pipe(map(ac => ac ? ac.dialogTitle : ''));
    this.isVisible$ = this.activeComponent$.pipe(map(ac => ac !== null));
  }

  public ngOnInit(): void {
    this.heightSubject.next(this.getInitialHeightPx());
  }

  public ngOnDestroy() {
    this.menubarService.closePanel();
  }

  public sizeChanged(changedHeight: number) {
    let initialHeight = this.heightSubject.value;
    const height = initialHeight - changedHeight;
    this.heightSubject.next(height);
  }

  public getHeight() {
    if (this.isMaximized || this.isMinimized) {
      return '';
    }
    return `${this.heightSubject.value}px`;
  }

  public closeDialog() {
    this.menubarService.closePanel();
  }

  private getInitialHeightPx(): number {
    const screenHeight = BrowserHelper.getScreenHeight();
    const mobileMenubarHeight = CssHelper.getCssVariableValueNumeric('--mobile-menubar-height');
    return Math.max(0, (screenHeight - mobileMenubarHeight) * 0.5);
  }

}
