import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy, Input } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MenubarService } from '../../menubar/menubar.service';

@Component({
  selector: 'tm-mobile-menubar-panel',
  templateUrl: './mobile-menubar-panel.component.html',
  styleUrls: ['./mobile-menubar-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MobileMenubarPanelComponent implements OnDestroy, OnInit {
  private menubarService = inject(MenubarService);

  @Input()
  public initialHeight = 350;

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
    this.heightSubject.next(this.initialHeight || 350);
  }

  public ngOnDestroy() {
    this.menubarService.closePanel();
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

}
