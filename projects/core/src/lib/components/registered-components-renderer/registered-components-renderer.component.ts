import {
  Component, OnInit, ChangeDetectionStrategy, Input, ViewChild, ViewContainerRef, ChangeDetectorRef, DestroyRef,
} from '@angular/core';
import { ComponentModel } from '@tailormap-viewer/api';
import { AreaType, ComponentRegistrationService } from '../../services/component-registration.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';
import { ComponentConfigHelper } from '../../shared/helpers/component-config.helper';

@Component({
  selector: 'tm-registered-components-renderer',
  templateUrl: './registered-components-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisteredComponentsRendererComponent implements OnInit {

  @Input({ required: true })
  public area: AreaType | string = '';

  @Input({ required: true })
  public config: ComponentModel[] = [];

  @ViewChild('componentsContainer', { read: ViewContainerRef, static: true })
  private componentsContainer: ViewContainerRef | null = null;

  constructor(
    private componentRegistrationService: ComponentRegistrationService,
    private cdr: ChangeDetectorRef,
    private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    this.componentRegistrationService.getRegisteredComponents$(this.area)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(10),
      )
      .subscribe(components => {
        if (!this.componentsContainer) {
          return;
        }
        DynamicComponentsHelper.createComponents(
          ComponentConfigHelper.filterDisabledComponents(components, this.config),
          this.componentsContainer,
        );
        this.cdr.detectChanges();
      });
  }

}
