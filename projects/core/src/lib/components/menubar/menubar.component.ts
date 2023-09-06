import {
  ChangeDetectorRef,
  Component, ComponentRef, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef,
} from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { MenubarService } from './menubar.service';
import { Subject } from 'rxjs';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';
import { ComponentModel } from '@tailormap-viewer/api';
import { ComponentConfigHelper } from '../../shared/helpers/component-config.helper';

@Component({
  selector: 'tm-menubar',
  templateUrl: './menubar.component.html',
  styleUrls: ['./menubar.component.css'],
})
export class MenubarComponent implements OnInit, OnDestroy {

  @Input({ required: true })
  public config: ComponentModel[] = [];

  @ViewChild('menuButtonsContainer', { read: ViewContainerRef, static: true })
  private menuButtonsContainer: ViewContainerRef | null = null;

  private destroyed = new Subject();
  public injectedComponents: ComponentRef<any>[] = [];

  constructor(
    private menubarService: MenubarService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  public ngOnInit(): void {
    this.menubarService.getRegisteredComponents$()
      .pipe(
        takeUntil(this.destroyed),
      )
      .subscribe(components => {
        if (!this.menuButtonsContainer) {
          return;
        }
        DynamicComponentsHelper.destroyComponents(this.injectedComponents);
        this.injectedComponents = DynamicComponentsHelper.createComponents(
          ComponentConfigHelper.filterDisabledComponents(components, this.config),
          this.menuButtonsContainer,
        );
        this.cdr.detectChanges();
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
