import {
  Component, OnInit, ChangeDetectionStrategy, ViewChild, ViewContainerRef, Input, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { MapControlsService } from './map-controls.service';
import { debounceTime } from 'rxjs';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';
import { ComponentModel } from '@tailormap-viewer/api';
import { ComponentConfigHelper } from '../../shared/helpers/component-config.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-map-controls',
  templateUrl: './map-controls.component.html',
  styleUrls: ['./map-controls.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapControlsComponent implements OnInit {

  @Input({ required: true })
  public config: ComponentModel[] = [];

  @ViewChild('mapControlsContainer', { read: ViewContainerRef, static: true })
  private mapControlsContainer: ViewContainerRef | null = null;

  constructor(
    private mapControlsService: MapControlsService,
    private cdr: ChangeDetectorRef,
    private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    this.mapControlsService.getRegisteredComponents$()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(10),
      )
      .subscribe(components => {
        if (!this.mapControlsContainer) {
          return;
        }
        DynamicComponentsHelper.createComponents(
          ComponentConfigHelper.filterDisabledComponents(components, this.config),
          this.mapControlsContainer,
        );
        this.cdr.detectChanges();
      });
  }

}
