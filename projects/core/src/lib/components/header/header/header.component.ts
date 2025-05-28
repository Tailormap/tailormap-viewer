import { ChangeDetectionStrategy, Component, effect, ElementRef, OnDestroy, Signal, viewChild, computed, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectComponentsConfigForType } from '../../../state';
import { BaseComponentTypeEnum, ComponentModel, HEADER_LOGO_CATEGORY, HeaderComponentConfigModel } from '@tailormap-viewer/api';
import { CssHelper } from '@tailormap-viewer/shared';
import { HeaderHelper } from './header.helper';

@Component({
  selector: 'tm-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class HeaderComponent implements OnDestroy {

  public config: Signal<ComponentModel<HeaderComponentConfigModel> | null>;
  public headerContainer = viewChild<ElementRef<HTMLDivElement>>('headerContainer');
  public measurementContainer = viewChild<ElementRef<HTMLDivElement>>('measurementContainer');

  private menuItemsToShow = signal<number>(0);
  private resizeObserver: ResizeObserver | null = null;

  public visibleMenuItems = computed(() => {
    const config = this.config();
    const itemsToShow = this.menuItemsToShow();
    if (!config?.config?.menuItems) return [];
    return config.config.menuItems.slice(0, itemsToShow);
  });

  public overflowMenuItems = computed(() => {
    const config = this.config();
    const itemsToShow = this.menuItemsToShow();
    if (!config?.config?.menuItems) return [];
    return config.config.menuItems.slice(itemsToShow);
  });

  constructor(
    private store$: Store,
  ) {
    this.config = this.store$.selectSignal(selectComponentsConfigForType(BaseComponentTypeEnum.HEADER));

    effect(() => {
      const config = this.config();
      const headerContainer = this.headerContainer();
      if (config && config.config && headerContainer) {
        CssHelper.setCssVariableValue('--header-component-height', (config.config.height ?? 100) + 'px');
        CssHelper.setCssVariableValue('--header-text-color', config.config.textColor || '#000000', headerContainer.nativeElement);
        CssHelper.setCssVariableValue('--header-background-color', config.config.backgroundColor || '#ffffff', headerContainer.nativeElement);
      }
      this.setCss(config?.config?.css || '', headerContainer);
      this.setupResizeObserver();
    });
  }

  private setupResizeObserver(): void {
    const headerContainer = this.headerContainer()?.nativeElement;
    this.cleanupResizeObserver();
    if (!headerContainer) {
      return;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || entry.target !== headerContainer) {
        return;
      }
      this.calculateVisibleMenuItems();
    });
    this.resizeObserver.observe(headerContainer);
    this.calculateVisibleMenuItems();
  }

  public calculateVisibleMenuItems() {
    const headerContainer = this.headerContainer()?.nativeElement;
    const measurementContainer = this.measurementContainer()?.nativeElement;
    if (headerContainer && measurementContainer) {
      this.menuItemsToShow.set(HeaderHelper.calculateVisibleMenuItems(headerContainer, measurementContainer));
    }
  }

  public getUrl(url: string) {
    return `/api/uploads/${HEADER_LOGO_CATEGORY}/${url}/logo`;
  }

  private setCss(css: string, headerContainer?: ElementRef<HTMLDivElement>) {
    if (!headerContainer) {
      this.cleanUpCss();
      return;
    }
    HeaderHelper.setHeaderComponentCss(css, headerContainer.nativeElement);
  }

  public ngOnDestroy() {
    this.cleanUpCss();
    this.cleanupResizeObserver();
  }

  private cleanUpCss() {
    const styleSheet = document.querySelector<HTMLStyleElement>('#header-component-css');
    if (styleSheet && styleSheet.parentElement) {
      styleSheet.parentElement.removeChild(styleSheet);
    }
  }

  private cleanupResizeObserver(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

}
