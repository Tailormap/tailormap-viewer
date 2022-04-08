import {
  ChangeDetectorRef,
  Component, ComponentFactoryResolver, ComponentRef, OnDestroy, OnInit, ViewChild, ViewContainerRef,
} from '@angular/core';
import { delay, takeUntil } from 'rxjs/operators';
import { MenubarService } from './menubar.service';
import { Subject } from 'rxjs';
import { DynamicComponentsHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-menubar',
  templateUrl: './menubar.component.html',
  styleUrls: ['./menubar.component.css'],
})
export class MenubarComponent implements OnInit, OnDestroy {

  @ViewChild('menuButtonsContainer', { read: ViewContainerRef, static: true })
  private menuButtonsContainer: ViewContainerRef | null = null;

  private destroyed = new Subject();
  public injectedComponents: ComponentRef<any>[] = [];

  constructor(
    private menubarService: MenubarService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private cdr: ChangeDetectorRef,
  ) {
  }

  public ngOnInit(): void {
    this.menubarService.getRegisteredComponents$()
      .pipe(
        takeUntil(this.destroyed),
        delay(0),
      )
      .subscribe(components => {
        if (!this.menuButtonsContainer) {
          return;
        }
        DynamicComponentsHelper.destroyComponents(this.injectedComponents);
        this.injectedComponents = DynamicComponentsHelper.createComponents(
          components,
          this.menuButtonsContainer,
          this.componentFactoryResolver,
        );
        this.cdr.detectChanges();
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
