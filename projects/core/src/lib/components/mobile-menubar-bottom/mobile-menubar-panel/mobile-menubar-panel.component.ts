import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy, DestroyRef } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MenubarService } from '../../menubar/menubar.service';
import { BrowserHelper, CssHelper } from '@tailormap-viewer/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-mobile-menubar-panel',
  templateUrl: './mobile-menubar-panel.component.html',
  styleUrls: ['./mobile-menubar-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MobileMenubarPanelComponent implements OnDestroy, OnInit {
  private menubarService = inject(MenubarService);
  private destroyRef = inject(DestroyRef);


  public activeComponent$: Observable<{ componentId: string; dialogTitle: string } | null>;
  public dialogTitle$: Observable<string>;
  public isVisible$: Observable<boolean>;

  private heightSubject: BehaviorSubject<number> = new BehaviorSubject(350);
  public height$ = this.heightSubject.asObservable();

  constructor() {
    this.activeComponent$ = this.menubarService.getActiveComponent$().pipe(
      debounceTime(0),
    );
    this.dialogTitle$ = this.activeComponent$.pipe(map(ac => ac ? ac.dialogTitle : ''));
    this.isVisible$ = this.activeComponent$.pipe(map(ac => ac !== null));
  }

  public ngOnInit(): void {
    this.heightSubject.next(this.getInitialHeightPx());
    this.menubarService.getMobilePanelHeight$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(height => {
        if (height !== null) {
          this.heightSubject.next(height);
        }
    });
    this.activeComponent$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(activeComponent => {
        if (MenubarService.MOBILE_MENUBAR_HOME_COMPONENTS.includes(activeComponent?.componentId ?? '')) {
          this.menubarService.setMobilePanelHeight(400);
        }
    });
  }

  public ngOnDestroy() {
    this.menubarService.closePanel();
  }

  public closeDialog() {
    this.menubarService.closePanel();
  }

  private getInitialHeightPx(): number {
    const screenHeight = BrowserHelper.getScreenHeight();
    const mobileMenubarHeight = CssHelper.getCssVariableValueNumeric('--mobile-menubar-height');
    return (screenHeight - mobileMenubarHeight) * 0.5;
  }

}
