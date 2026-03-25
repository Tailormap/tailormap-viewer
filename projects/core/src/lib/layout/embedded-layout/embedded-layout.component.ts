import { Component, ChangeDetectionStrategy, inject, viewChild, ElementRef, effect } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { LayoutService } from '../layout.service';
import { MapService } from '@tailormap-viewer/map';
import { Subject, takeUntil } from 'rxjs';
import { BookmarkService } from '../../services/bookmark/bookmark.service';
import { ApplicationBookmarkFragments } from '../../services/application-bookmark/application-bookmark-fragments';
import { take } from 'rxjs/operators';

@Component({
  selector: 'tm-embedded-layout',
  templateUrl: './embedded-layout.component.html',
  styleUrls: [ '../base-layout/base-layout.component.css', './embedded-layout.component.css' ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EmbeddedLayoutComponent {
  public layoutService = inject(LayoutService);
  private mapService = inject(MapService);
  private bookmarkService = inject(BookmarkService);
  public componentTypes = BaseComponentTypeEnum;

  private mapContainer = viewChild('mapContainer', { read: ElementRef });

  private intersectionObserver = new IntersectionObserver(entries => {
    if (entries.length > 0 && entries[0].boundingClientRect.width > 0 && entries[0].boundingClientRect.height > 0) {
      this.zoomToInitialExtent();
    }
  }, { threshold: 1 });

  private resizeObserver = new ResizeObserver(entries => {
    if (entries.length > 0 && entries[0].contentRect.width > 0 && entries[0].contentRect.height > 0) {
      this.zoomToInitialExtent();
    }
  });

  constructor() {
    /**
     * In case the embedded viewer is initially hidden (by the parent page) the map does not always render to initial extent
     * We need to account for the various ways hiding elements can be done (off-screen, height = 0, display none, etc).
     * We use both an IntersectionObserver and ResizeObserver to watch for changes. We do this as long as the user did not move the map.
     * The assumption here is that as long the user did not touch the map there is no harm in setting initial extent
     * We only zoom to initial extent in case there is no location inside the bookmark initially
     */
    const mapMoved = new Subject<void>();
    effect(() => {
      const el = this.mapContainer()?.nativeElement;
      if (!el || mapMoved.closed) {
        return;
      }
      this.intersectionObserver.disconnect();
      this.intersectionObserver.observe(el);
      this.resizeObserver.disconnect();
      this.resizeObserver.observe(el);
    });
    this.mapService.hasUserInteractedWithMap$()
      .pipe(takeUntil(mapMoved))
      .subscribe(hasInteracted => {
        if (!hasInteracted) {
          return;
        }
        this.intersectionObserver.disconnect();
        this.resizeObserver.disconnect();
        mapMoved.next();
        mapMoved.complete();
      });
  }

  private zoomToInitialExtent(): void {
    this.bookmarkService.registerFragment$<string>(ApplicationBookmarkFragments.LOCATION_BOOKMARK_DESCRIPTOR)
      .pipe(take(1))
      .subscribe(fragment => {
        if (!fragment) {
          window.setTimeout(() => { this.mapService.zoomToInitialExtent(); }, 0);
        }
      });
  }

}
