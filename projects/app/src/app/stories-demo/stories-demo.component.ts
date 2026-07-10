import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, NgZone, OnDestroy, QueryList, ViewChildren,
} from '@angular/core';
import { mountStoriesViewer, StoriesViewerRef } from '@tailormap-viewer/core';
import { MapService } from '@tailormap-viewer/map';
import { storiesViewerAppProviders } from '../stories.config';

interface DemoLocation {
  label: string;
  /** WKT point in EPSG:4326; `MapService.zoomTo` reprojects to whatever the viewer's map uses. */
  wkt: string;
  zoomLevel: number;
  projection?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './stories-demo.component.html',
  styleUrls: ['./stories-demo.component.css'],
})
export class StoriesDemoComponent implements AfterViewInit, OnDestroy {

  @ViewChildren('viewerHost') private viewerHosts!: QueryList<ElementRef<HTMLElement>>;

  private ngZone = inject(NgZone);
  private changeDetectorRef = inject(ChangeDetectorRef);

  // Each viewer is bootstrapped as its own Angular application with its own store, effects and map.
  // The viewer id follows the `app/<name>` convention used by loadViewer.
  public viewerNames = [ 'default', 'austria', 'test' ];

  // A demo location per viewer, used by the "zoom to" button below each viewer to show how the host
  // page can drive one specific viewer instance from outside its component tree.
  public demoLocations: DemoLocation[] = [
    { label: 'Amsterdam', wkt: 'POINT(4.895168 52.370216)', zoomLevel: 12 },
    { label: 'Vienna', wkt: 'POINT(16.373819 48.208174)', zoomLevel: 12 },
    { label: 'Street', wkt: 'POINT(130549.63 459364.44)', zoomLevel: 22, projection: 'EPSG:28992' },
  ];

  // Indexed to match viewerNames/viewerHosts; a slot stays undefined until that viewer has finished
  // mounting (mounting is async, so hosts can resolve out of order).
  public viewerRefs: Array<StoriesViewerRef | undefined> = [];

  public ngAfterViewInit(): void {
    // createApplication() constructs a new NgZone. Doing that from inside this (host) component's
    // Angular zone would fork the new zone as a child of the host zone instead of the root zone,
    // which breaks the new application's own zone-stable detection (NG0909 "Expected to not be in
    // Angular Zone, but it is!" when it later checks `onStable`). Mounting must happen outside the
    // host zone so each viewer application gets its own, independent zone.
    this.ngZone.runOutsideAngular(() => {
      this.viewerHosts.forEach((hostRef, index) => {
        mountStoriesViewer({
          hostElement: hostRef.nativeElement,
          viewerId: `app/${this.viewerNames[index]}`,
          providers: storiesViewerAppProviders,
        }).then(ref => {
          this.viewerRefs[index] = ref;
          // The mount promise resolves outside the host's Angular zone, so the "zoom to" button's
          // disabled state needs an explicit check to update.
          this.changeDetectorRef.detectChanges();
        });
      });
    });
  }

  public ngOnDestroy(): void {
    this.viewerRefs.forEach(ref => ref?.destroy());
    this.viewerRefs = [];
  }

  /** Zooms only the viewer at `index` to its demo location, driven from outside that viewer instance. */
  public zoomToDemoLocation(index: number): void {
    const ref = this.viewerRefs[index];
    const location = this.demoLocations[index];
    if (!ref || !location) {
      return;
    }
    ref.getService(MapService).zoomTo(location.wkt, location.projection || 'EPSG:4326', location.zoomLevel);
  }

}
