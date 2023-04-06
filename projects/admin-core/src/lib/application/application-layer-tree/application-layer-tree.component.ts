import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { TreeDragDropService, TreeModel, TreeService } from '@tailormap-viewer/shared';
import { Observable, of } from 'rxjs';
import { AppTreeNodeModel } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-admin-application-layer-tree',
  templateUrl: './application-layer-tree.component.html',
  styleUrls: ['./application-layer-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeDragDropService],
})
export class ApplicationLayerTreeComponent implements OnInit {

  @Input()
  public treeNodes$: Observable<TreeModel<AppTreeNodeModel>[]> = of([]);

  @Output()
  public addSubFolder = new EventEmitter<string>();

  constructor(
    private treeService: TreeService,
  ) { }

  public ngOnInit(): void {
    this.treeService.setDataSource(this.treeNodes$);
  }

}
