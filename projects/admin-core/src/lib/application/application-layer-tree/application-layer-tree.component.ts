import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { TreeDragDropService, TreeService } from '@tailormap-viewer/shared';
import { Store } from '@ngrx/store';

@Component({
  selector: 'tm-admin-application-layer-tree',
  templateUrl: './application-layer-tree.component.html',
  styleUrls: ['./application-layer-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ TreeService, TreeDragDropService ],
})
export class ApplicationLayerTreeComponent implements OnInit {

  constructor(
    private store$: Store,
  ) { }

  public ngOnInit(): void {
  }

}
