import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, Observable, Subject } from 'rxjs';

import { FlatTreeControl } from '@angular/cdk/tree';
import { FlatTreeHelper } from './helpers/flat-tree.helper';
import { MatTreeFlatDataSource } from '@angular/material/tree';
import { TreeModel, FlatTreeModel, NodePositionChangedEventModel } from './models';
import { takeUntil } from 'rxjs/operators';
import { BaseTreeModel } from './models/base-tree.model';
import { ArrayHelper } from '../../helpers';

@Injectable()
export class TreeService<T = any> implements OnDestroy {

  private destroyed = new Subject();

  // Observable string sources
  private selectedNode = new BehaviorSubject<string>('');
  private readonlyMode = new BehaviorSubject<boolean>(false);
  private checkStateChangedSource = new Subject<BaseTreeModel<T>[]>();
  private selectionStateChangedSource = new Subject<BaseTreeModel<T>>();
  private nodeExpansionChangedSource = new Subject<BaseTreeModel<T>>();
  private nodePositionChangedSource = new Subject<NodePositionChangedEventModel>();

  // Streams used in the tree component
  public selectedNode$ = this.selectedNode.asObservable();
  public readonlyMode$ = this.readonlyMode.asObservable();

  // Streams triggered by tree, to be used in 'consuming' components
  public checkStateChangedSource$ = this.checkStateChangedSource.asObservable();
  public selectionStateChangedSource$ = this.selectionStateChangedSource.asObservable();
  public nodeExpansionChangedSource$ = this.nodeExpansionChangedSource.asObservable();
  public nodePositionChangedSource$ = this.nodePositionChangedSource.asObservable();

  private nodesMap = new Map<string, FlatTreeModel>();
  public checkedMap = new Map<string, boolean>();
  public indeterminateMap = new Map<string, boolean>();

  private readonly treeControl: FlatTreeControl<FlatTreeModel>;
  private readonly dataSource: MatTreeFlatDataSource<TreeModel, FlatTreeModel>;

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
      .pipe(
        takeUntil(this.destroyed),
        distinctUntilChanged(),
        filter(data => !!data),
      )
      .subscribe(data => {
        const flatTree = FlatTreeHelper.getTreeFlattener().flattenNodes(data);
        if (this.dataChanged(flatTree)) {
          this.dataSource.data = data;
        }
        this.updateCaches(flatTree);
        this.expandNodes(flatTree);
      });
  }

  private dataChanged(newTreeNodes: FlatTreeModel[]) {
    const currentNodeIds = this.treeControl.dataNodes.map(node => node.id);
    const newTreeNodeIds = newTreeNodes.map(node => node.id);
    return !ArrayHelper.arrayEquals(currentNodeIds, newTreeNodeIds);
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
    changedNodes.forEach(node => this.checkedMap.set(node.id, node.checked));
    this.updateLevelCheckedCache();
    this.checkStateChangedSource.next(changedNodes);
  }

  public selectionStateChanged(node: FlatTreeModel) {
    this.selectionStateChangedSource.next(node);
  }

  public toggleNodeExpanded(node: FlatTreeModel) {
    this.treeControl.toggle(node);
    this.nodeExpansionChangedSource.next(node);
  }

  public nodePositionChanged(evt: NodePositionChangedEventModel) {
    this.nodePositionChangedSource.next(evt);
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private expandNodes(flatNodes: FlatTreeModel[]) {
    (flatNodes || []).forEach((flatNode) => {
      const node = this.getNode(flatNode.id);
      if (node && flatNode.expandable && flatNode.expanded) {
        this.treeControl.expand(node);
      } else if(node && flatNode.expandable && !flatNode.expanded) {
        this.treeControl.collapse(node);
      }
    });
  }

  private updateCaches(data: FlatTreeModel[]) {
    this.checkedMap.clear();
    this.indeterminateMap.clear();
    this.nodesMap.clear();
    this.treeControl.dataNodes.forEach(node => {
      this.nodesMap.set(node.id, node);
      if (!FlatTreeHelper.isExpandable(node)) {
        const updated = (data || []).find(c => c.id === node.id);
        this.checkedMap.set(node.id, (updated || node).checked);
      }
    });
    this.updateLevelCheckedCache();
  }

  private updateLevelCheckedCache() {
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
