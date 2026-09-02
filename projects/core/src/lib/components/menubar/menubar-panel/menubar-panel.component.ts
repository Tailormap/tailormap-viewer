import { Component, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { MenubarService } from '../menubar.service';
import { map, Observable } from 'rxjs';
import { CssHelper } from '@tailormap-viewer/shared';
import { debounceTime } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-menubar-panel',
    templateUrl: './menubar-panel.component.html',
    styleUrls: ['./menubar-panel.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    host: { '[attr.aria-expanded]': 'isExpanded()' },
    imports: [
        DialogComponent,
        AsyncPipe,
    ],
})
export class MenubarPanelComponent implements OnDestroy {
  private menubarService = inject(MenubarService);

  public activeComponent$: Observable<{ componentId: string; dialogTitle: string } | null>;
  public isExpanded = toSignal(
    this.menubarService.getActiveComponent$().pipe(
      map(ac => ac !== null),
    ),
    { initialValue: false },
  );

  public panelWidth = 300;
  public panelMaxWidth = 600;
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

  public onPanelWidthChanged(width: number) {
    this.panelWidth = width;
    this.menubarService.setPanelWidth(width);
  }
}
