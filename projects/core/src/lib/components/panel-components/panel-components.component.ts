import {
  Component, OnInit, ChangeDetectionStrategy, ComponentRef, ViewChild, ViewContainerRef, DestroyRef,
} from '@angular/core';
import { PanelComponentsService } from './panel-components.service';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-panel-components',
  templateUrl: './panel-components.component.html',
  styleUrls: ['./panel-components.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelComponentsComponent implements OnInit {

  private injectedComponents: ComponentRef<any>[] = [];

  @ViewChild('panelComponentsContainer', { read: ViewContainerRef, static: true })
  private panelComponentsContainer: ViewContainerRef | null = null;

  constructor(
    private panelComponentsService: PanelComponentsService,
    private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    this.panelComponentsService.getRegisteredComponents$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(components => {
        if (!this.panelComponentsContainer) {
          return;
        }
        DynamicComponentsHelper.destroyComponents(this.injectedComponents);
        this.injectedComponents = DynamicComponentsHelper.createComponents(components, this.panelComponentsContainer);
      });
  }

}
