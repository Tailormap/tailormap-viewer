import {
  ChangeDetectorRef,
  Component, DestroyRef, Input, OnInit, ViewChild, ViewContainerRef,
} from '@angular/core';
import { MenubarService } from './menubar.service';
import { debounceTime } from 'rxjs';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';
import { ComponentModel } from '@tailormap-viewer/api';
import { ComponentConfigHelper } from '../../shared/helpers/component-config.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-menubar',
  templateUrl: './menubar.component.html',
  styleUrls: ['./menubar.component.css'],
})
export class MenubarComponent implements OnInit {

  @Input({ required: true })
  public config: ComponentModel[] = [];

  @ViewChild('menuButtonsContainer', { read: ViewContainerRef, static: true })
  private menuButtonsContainer: ViewContainerRef | null = null;

  constructor(
    private menubarService: MenubarService,
    private cdr: ChangeDetectorRef,
    private destroyRef: DestroyRef,
  ) {
  }

  public ngOnInit(): void {
    this.menubarService.getRegisteredComponents$()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(10),
      )
      .subscribe(components => {
        if (!this.menuButtonsContainer) {
          return;
        }
        DynamicComponentsHelper.createComponents(
          ComponentConfigHelper.filterDisabledComponents(components, this.config),
          this.menuButtonsContainer,
        );
        this.cdr.detectChanges();
      });
  }

}
