import {
  Component, OnInit, ChangeDetectionStrategy, ComponentRef, ViewChild, ViewContainerRef, OnDestroy,
} from '@angular/core';
import { MapControlsService } from './map-controls.service';
import { Subject, takeUntil } from 'rxjs';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapControlsComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();

  private injectedComponents: ComponentRef<any>[] = [];

  @ViewChild('mapControlsContainer', { read: ViewContainerRef, static: true })
  private mapControlsContainer: ViewContainerRef | null = null;

  constructor(
    private mapControlsService: MapControlsService,
  ) { }

  public ngOnInit(): void {
    this.mapControlsService.getRegisteredComponents$()
      .pipe(
        takeUntil(this.destroyed),
      )
      .subscribe(components => {
        if (!this.mapControlsContainer) {
          return;
        }
        DynamicComponentsHelper.destroyComponents(this.injectedComponents);
        this.injectedComponents = DynamicComponentsHelper.createComponents(components, this.mapControlsContainer);
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
