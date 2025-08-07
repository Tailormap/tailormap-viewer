import { Component, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { MenubarService } from '../menubar.service';
import { Observable } from 'rxjs';
import { CssHelper } from '@tailormap-viewer/shared';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'tm-menubar-panel',
  templateUrl: './menubar-panel.component.html',
  styleUrls: ['./menubar-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MenubarPanelComponent implements OnDestroy {
  private menubarService = inject(MenubarService);


  public activeComponent$: Observable<{ componentId: string; dialogTitle: string } | null>;

  public panelWidth = 300;
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width');

  constructor() {
    const menubarService = this.menubarService;
    this.activeComponent$ = this.menubarService.getActiveComponent$().pipe(
      debounceTime(0),
    );
    this.panelWidth = menubarService.panelWidth;
  }

  public ngOnDestroy() {
    this.menubarService.closePanel();
  }

  public closeDialog() {
    this.menubarService.closePanel();
  }

}
