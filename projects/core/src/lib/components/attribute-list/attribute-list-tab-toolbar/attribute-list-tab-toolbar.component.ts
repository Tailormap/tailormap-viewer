import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';
import { Store } from '@ngrx/store';
import { PopoverService, OverlayRef, PopoverPositionEnum } from '@tailormap-viewer/shared';
import { Observable, of } from 'rxjs';
import {
  selectDataForSelectedTab, selectLoadingDataSelectedTab,
} from '../state/attribute-list.selectors';
import { AttributeListDataModel } from '../models/attribute-list-data.model';
import { PageEvent } from '@angular/material/paginator';
import { updatePage } from '../state/attribute-list.actions';
import { AttributeListStateService } from '../services/attribute-list-state.service';
import { AttributeListPagingDialogComponent } from '../attribute-list-paging-dialog/attribute-list-paging-dialog.component';

@Component({
  selector: 'tm-attribute-list-tab-toolbar',
  templateUrl: './attribute-list-tab-toolbar.component.html',
  styleUrls: ['./attribute-list-tab-toolbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeListTabToolbarComponent implements OnInit, OnDestroy {

  public columns: AttributeListColumnModel[] = [];

  private pagingPopover: OverlayRef | null = null;
  public loadingData$: Observable<boolean> = of(false);
  public data$: Observable<AttributeListDataModel | null> = of(null);

  constructor(
    private store$: Store,
    private popoverService: PopoverService,
    private attributeListStateService: AttributeListStateService,
  ) {
  }

  public ngOnInit() {
    this.loadingData$ = this.store$.select(selectLoadingDataSelectedTab);
    this.data$ = this.store$.select(selectDataForSelectedTab);
  }

  public ngOnDestroy() {
    if (this.pagingPopover) {
      this.pagingPopover.close();
    }
  }

  public onPageChange($event: PageEvent): void {
    this.attributeListStateService.executeActionForCurrentData(dataId => {
      this.store$.dispatch(updatePage({dataId, page: $event.pageIndex}));
    });
  }

  public showJumpToPage($event: MouseEvent) {
    if (!$event.target || !($event.target instanceof HTMLElement)) {
      return;
    }
    if ($event.target.classList.contains('mat-paginator-range-label')) {
      if (this.pagingPopover && this.pagingPopover.isOpen) {
        this.pagingPopover.close();
        return;
      }
      const WINDOW_WIDTH = 150;
      this.pagingPopover = this.popoverService.open({
        origin: $event.target,
        content: AttributeListPagingDialogComponent,
        height: 90,
        width: Math.min(WINDOW_WIDTH, window.innerWidth),
        closeOnClickOutside: true,
        position: PopoverPositionEnum.BOTTOM_RIGHT_DOWN,
        positionOffset: 10,
      });
    }
  }

}
