import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MapService } from '@tailormap-viewer/map';
import { Store } from '@ngrx/store';
import { selectEnable3D } from '../../../state/core.selectors';


@Component({
  selector: 'tm-switch3-d',
  templateUrl: './switch3-d.component.html',
  styleUrls: ['./switch3-d.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Switch3DComponent implements OnDestroy {

  private destroyed = new Subject();
  public enable$: Observable<boolean>;

  constructor(
    private store$: Store,
    private mapService: MapService,
  ) {
    this.enable$ = this.store$.select(selectEnable3D);
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public toggle() {
    this.mapService.switch3D$();
  }
}
