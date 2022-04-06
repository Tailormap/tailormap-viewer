import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { FlatTreeControl } from '@angular/cdk/tree';
import { FlatTreeHelper } from './helpers/flat-tree.helper';
import { MatTreeFlatDataSource } from '@angular/material/tree';
import { TreeModel, FlatTreeModel, NodePositionChangedEventModel } from './models';
import { takeUntil } from 'rxjs/operators';
import { BaseTreeModel } from './models/base-tree.model';

export type CheckStateChange<T = any> = BaseTreeModel<T>[];

@Injectable()
export class TreeService<T = any> implements OnDestroy {

  private destroyed = new Subject();

  // Observable string sources
  private treeDataSource = new BehaviorSubject<TreeModel[]>([]);
  private selectedNode = new BehaviorSubject<string>('');
  private readonlyMode = new BehaviorSubject<boolean>(false);
  private checkStateChangedSource = new Subject<CheckStateChange<T>>();
  private selectionStateChangedSource = new Subject<string>();
  private nodeExpansionChangedSource = new Subject<string>();
  private nodePositionChangedSource = new Subject<NodePositionChangedEventModel>();

  // Observable string streams
  public treeDataSource$ = this.treeDataSource.asObservable();
  public selectedNode$ = this.selectedNode.asObservable();
  public readonlyMode$ = this.readonlyMode.asObservable();
  public checkStateChangedSource$ = this.checkStateChangedSource.asObservable();
  public selectionStateChangedSource$ = this.selectionStateChangedSource.asObservable();
  public nodeExpansionChangedSource$ = this.nodeExpansionChangedSource.asObservable();
  public nodePositionChangedSource$ = this.nodePositionChangedSource.asObservable();

  private nodesMap = new Map<string, FlatTreeModel>();
  public checkedMap = new Map<string, boolean>();
  public indeterminateMap = new Map<string, boolean>();

  private readonly treeControl: FlatTreeControl<FlatTreeModel>;
  private readonly dataSource: MatTreeFlatDataSource<TreeModel, FlatTreeModel>;

  private skipNextUpdate = false;
  private first = true;

  public constructor() {
    this.treeControl = new FlatTreeControl<FlatTreeModel>(FlatTreeHelper.getLevel, FlatTreeHelper.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, FlatTreeHelper.getTreeFlattener());
    this.dataSource.data = [];
    this.treeControl.dataNodes = [];
  }

  public getTreeControl() {
    return this.treeControl;
  }

  public getDataNodes() {
    return this.treeControl.dataNodes;
  }

  public getTreeDataSource() {
    return this.dataSource;
  }

  public hasNode(nodeId: string) {
    return this.nodesMap.has(nodeId);
  }

  public isExpandable(nodeId: string) {
    const node = this.nodesMap.get(nodeId);
    if (node) {
      return this.treeControl.isExpandable(node);
    }
    return false;
  }

  public isReadonlyNode(nodeId: string) {
    const node = this.nodesMap.get(nodeId);
    if (node) {
      return node.readOnlyItem;
    }
    return false;
  }

  public isExpanded(nodeId: string) {
    const node = this.nodesMap.get(nodeId);
    if (node) {
      return this.treeControl.isExpanded(node);
    }
    return false;
  }

  public expandNode(nodeId: string) {
    const node = this.nodesMap.get(nodeId);
    if (node) {
      this.treeControl.expand(node);
      this.nodeExpanded(nodeId);
    }
    return false;
  }

  public getParent(nodeId: string) {
    const node = this.nodesMap.get(nodeId);
    if (!node) {
      return null;
    }
    const parent = FlatTreeHelper.getParentNode(node, this.treeControl.dataNodes);
    if (parent) {
      return parent.id;
    }
    return null;
  }

  // Service message commands
  public setDataSource(dataSource$: Observable<TreeModel[]>) {
    dataSource$
      .pipe(takeUntil(this.destroyed))
      .subscribe(data => {
        this.treeDataSource.next(data);
        if (this.first && data) {
          this.dataSource.data = data;
          this.expandNodes(this.treeControl.dataNodes);
          this.first = false;
        }
        this.rebuildTreeForData(data);
      });
  }

  public setSelectedNode(selectedNode$: Observable<string>) {
    selectedNode$
      .pipe(takeUntil(this.destroyed))
      .subscribe(data => this.selectedNode.next(data));
  }

  public setReadOnlyMode(readonlyMode: boolean) {
    this.readonlyMode.next(readonlyMode);
  }

  public checkStateChanged(changedNodes: FlatTreeModel[]) {
    this.updateCaches(changedNodes);
    // this.skipNextUpdate = true;
    this.checkStateChangedSource.next(changedNodes);
  }

  public selectionStateChanged(nodeId: string) {
    this.selectionStateChangedSource.next(nodeId);
  }

  public nodeExpanded(nodeId: string) {
    this.nodeExpansionChangedSource.next(nodeId);
  }

  public nodePositionChanged(evt: NodePositionChangedEventModel) {
    this.nodePositionChangedSource.next(evt);
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private rebuildTreeForData(data: TreeModel[]) {
    // this.dataSource.data = data;
    // this.expandNodes(this.treeControl.dataNodes);
    this.clearCaches();
    this.updateCaches(FlatTreeHelper.getTreeFlattener().flattenNodes(data));
  }

  private expandNodes(flatNodes: FlatTreeModel[]) {
    if (!flatNodes || flatNodes.length === 0) { return; }
    return flatNodes.forEach((node) => {
      if (node.expandable && node.expanded) {
        this.treeControl.expand(node);
      }
    });
  }

  private clearCaches() {
    this.checkedMap.clear();
    this.indeterminateMap.clear();
    this.nodesMap.clear();
  }

  private updateCaches(checkChange?: FlatTreeModel[]) {
    this.clearCaches();
    this.treeControl.dataNodes.forEach(node => {
      this.nodesMap.set(node.id, node);
      if (!FlatTreeHelper.isExpandable(node)) {
        const updated = (checkChange || []).find(c => c.id === node.id);
        this.checkedMap.set(node.id, !!(updated || node).checked);
      }
    });
    this.treeControl.dataNodes.forEach(node => {
      if (FlatTreeHelper.isExpandable(node)) {
        this.checkedMap.set(node.id, this.descendantsAllSelected(node));
        this.indeterminateMap.set(node.id, this.descendantsPartiallySelected(node));
      }
    });
  }

  private getCheckedState(node: FlatTreeModel): boolean {
    if (FlatTreeHelper.isExpandable(node)) {
      return this.descendantsAllSelected(node);
    }
    return this.isChecked(node);
  }

  public descendantsAllSelected(node: FlatTreeModel): boolean {
    const descendants = this.treeControl.getDescendants(node);
    if (descendants.length === 0) {
      return false;
    }
    return descendants.every(child => this.getCheckedState(child));
  }

  public descendantsPartiallySelected(node: FlatTreeModel): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const someChecked = descendants.some(child => this.getCheckedState(child));
    return someChecked && !this.checkedMap.get(node.id);
  }

  public isIndeterminate(node: FlatTreeModel) {
    return this.indeterminateMap.get(node.id) || false;
  }

  public isChecked(node: FlatTreeModel) {
    return this.checkedMap.get(node.id) || false;
  }

  public getNode(nodeId: string): FlatTreeModel | undefined {
    return this.nodesMap.get(nodeId);
  }

}
