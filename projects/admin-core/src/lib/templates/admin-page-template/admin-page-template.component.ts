import { Component, ChangeDetectionStrategy, Input, signal, computed } from '@angular/core';

const LOCALSTORAGE_LIST_WIDTH_KEY = 'tm-admin-page-template-list-width';

@Component({
  selector: 'tm-admin-admin-page-template',
  templateUrl: './admin-page-template.component.html',
  styleUrls: ['./admin-page-template.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdminPageTemplateComponent {

  public listWidth = signal(this.getInitialWidth());
  public listWidthStyle = computed(() => `${this.listWidth()}px`);

  @Input()
  public wrapContent = false;

  @Input()
  public pageClassName: string | string[] | undefined | null;

  public panelResized(delta: number) {
    const MIN_WIDTH = 200;
    const MAX_WIDTH = 600;
    const width = Math.min(Math.max(MIN_WIDTH, (this.listWidth() + delta)), MAX_WIDTH);
    this.listWidth.set(width);
    window.localStorage.setItem(LOCALSTORAGE_LIST_WIDTH_KEY, `${width}`);
  }

  private getInitialWidth() {
    const localStorageWidth: string | null = window.localStorage.getItem(LOCALSTORAGE_LIST_WIDTH_KEY);
    if (typeof localStorageWidth === 'string' && /\d+/.test(localStorageWidth)) {
      return +(localStorageWidth);
    }
    return 300;
  }

}
