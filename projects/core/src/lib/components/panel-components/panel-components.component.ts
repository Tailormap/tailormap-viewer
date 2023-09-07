import {
  Component, OnInit, ChangeDetectionStrategy, ViewChild, ViewContainerRef, DestroyRef, Input, Injector, ChangeDetectorRef,
} from '@angular/core';
import { PanelComponentsService } from './panel-components.service';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentModel } from '@tailormap-viewer/api';
import { ComponentConfigHelper } from '../../shared/helpers/component-config.helper';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'tm-panel-components',
  templateUrl: './panel-components.component.html',
  styleUrls: ['./panel-components.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelComponentsComponent implements OnInit {

  @Input({ required: true })
  public config: ComponentModel[] = [];

  @ViewChild('panelComponentsContainer', { read: ViewContainerRef, static: true })
  private panelComponentsContainer: ViewContainerRef | null = null;

  constructor(
    private panelComponentsService: PanelComponentsService,
    private destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef,
  ) { }

  public ngOnInit(): void {
    this.panelComponentsService.getRegisteredComponents$()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(10),
      )
      .subscribe(components => {
        if (!this.panelComponentsContainer) {
          return;
        }
        DynamicComponentsHelper.createComponents(
          ComponentConfigHelper.filterDisabledComponents(components, this.config),
          this.panelComponentsContainer,
        );
        this.cdr.detectChanges();
      });
  }

}
