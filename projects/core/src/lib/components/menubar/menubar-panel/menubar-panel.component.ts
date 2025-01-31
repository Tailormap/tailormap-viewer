import { Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { MenubarService } from '../menubar.service';
import { Observable } from 'rxjs';
import { CssHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-menubar-panel',
  templateUrl: './menubar-panel.component.html',
  styleUrls: ['./menubar-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MenubarPanelComponent implements OnDestroy {

  public activeComponent$: Observable<{ componentId: string; dialogTitle: string } | null>;

  public panelWidth = 300;
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width');

  constructor(
    private menubarService: MenubarService,
  ) {
    this.activeComponent$ = this.menubarService.getActiveComponent$();
    this.panelWidth = menubarService.panelWidth;
  }

  public ngOnDestroy() {
    this.menubarService.closePanel();
  }

  public closeDialog() {
    this.menubarService.closePanel();
  }

}
