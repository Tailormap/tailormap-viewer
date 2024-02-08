import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, Observable, Subject } from 'rxjs';

import { FlatTreeHelper } from './helpers/flat-tree.helper';
import { TreeModel, FlatTreeModel, NodePositionChangedEventModel } from './models';
import { map, takeUntil } from 'rxjs/operators';
import { BaseTreeModel } from './models/base-tree.model';
import { ArrayHelper } from '../../helpers';

@Injectable()
export class TreeService<T = any, TypeDef extends string = string> implements OnDestroy {

  private destroyed = new Subject();

  // Observable string sources
  private selectedNode = new BehaviorSubject<string>('');
  private readonlyMode = new BehaviorSubject<boolean>(false);
  private checkStateChangedSource = new Subject<BaseTreeModel<T, TypeDef>[]>();
  private selectionStateChangedSource = new Subject<BaseTreeModel<T, TypeDef>>();
  private nodeExpansionChangedSource = new Subject<{ expanded: boolean; node: BaseTreeModel<T, TypeDef> }>();
  private nodePositionChangedSource = new Subject<NodePositionChangedEventModel>();

  // Streams used in the tree component
  public selectedNode$ = this.selectedNode.asObservable();
  public readonlyMode$ = this.readonlyMode.asObservable();

  // Streams triggered by tree, to be used in 'consuming' components
  public checkStateChangedSource$: Observable<BaseTreeModel<T, TypeDef>[]> = this.checkStateChangedSource.asObservable();
  public selectionStateChangedSource$: Observable<BaseTreeModel<T, TypeDef>> = this.selectionStateChangedSource.asObservable();
  public nodeExpansionChangedSource$: Observable<{ expanded: boolean; node: BaseTreeModel<T, TypeDef> }> = this.nodeExpansionChangedSource.asObservable();
  public nodePositionChangedSource$: Observable<NodePositionChangedEventModel> = this.nodePositionChangedSource.asObservable();

  private nodesMap = new Map<string, FlatTreeModel<T, TypeDef>>();
  public checkedMap = new Map<string, boolean>();
  public indeterminateMap = new Map<string, boolean>();

  private readonly dataSource = new BehaviorSubject<{
    tree: FlatTreeModel<T, TypeDef>[];
    nodes: FlatTreeModel<T, TypeDef>[];
  }>({ tree: [], nodes:  [] });

  public constructor() {
  }

  public getTreeDataSource$() {
    return this.dataSource.asObservable().pipe(map(source => source.tree));
  }

  public hasNode(nodeId: string) {
    return this.nodesMap.has(nodeId);
  }

  public isExpandable(nodeId: string) {
    const node = this.nodesMap.get(nodeId);
    if (node) {
      return node.expandable;
    }
    return false;
  }

  public isExpanded(nodeId: string) {
    const node = this.nodesMap.get(nodeId);
    if (node) {
      return node.expanded;
    }
    return false;
  }

  public expandNode(nodeId: string) {
    const node = this.nodesMap.get(nodeId);
    if (node) {
      this.nodeExpansionChangedSource.next({ expanded: true, node });
    }
    return false;
  }

  public getParent(nodeId: string) {
    const node = this.nodesMap.get(nodeId);
    if (!node) {
      return null;
    }
    const parent = FlatTreeHelper.getParentNode(node, this.dataSource.value.nodes);
    if (parent) {
      return parent.id;
    }
    return null;
  }

  public isNodeOrInsideOwnTree(nodeId: string, dragNode: FlatTreeModel<T, TypeDef>) {
    if (nodeId === dragNode.id) {
      return true;
    }
    if (!dragNode.expandable) {
      return false;
    }
    const children = this.getDescendants(dragNode).map(node => node.id);
    return children.includes(nodeId);
  }

  // Service message commands
  public setDataSource(dataSource$: Observable<TreeModel<T, TypeDef>[]>) {
    dataSource$
      .pipe(
        takeUntil(this.destroyed),
        distinctUntilChanged(),
        filter(data => !!data),
      )
      .subscribe(data => {
        const treeFlattener = FlatTreeHelper.getTreeFlattener<T, TypeDef>();
        const flatTree = treeFlattener.flattenNodes(data);
        const expandedNodes = this.expandFlattenedNodes(flatTree);
        this.dataSource.next({
          tree: expandedNodes,
          nodes: flatTree,
        });
        this.updateCaches(flatTree);
      });
  }

  // Method borrowed from https://github.com/angular/components/blob/main/src/material/tree/data-source/flat-data-source.ts
  private expandFlattenedNodes(tree: FlatTreeModel<T, TypeDef>[]) {
    const results: FlatTreeModel<T, TypeDef>[] = [];
    const currentExpand: boolean[] = [];
    currentExpand[0] = true;

    tree.forEach(node => {
      let expand = true;
      for (let i = 0; i <= node.level; i++) {
        expand = expand && currentExpand[i];
      }
      if (expand) {
        results.push(node);
      }
      if (node.expandable) {
        currentExpand[node.level + 1] = node.expanded;
      }
    });
    return results;
  }

  // Method borrowed from https://github.com/angular/components/blob/main/src/cdk/tree/control/flat-tree-control.ts
  public getDescendants(node: FlatTreeModel<T, TypeDef>): FlatTreeModel<T, TypeDef>[] {
    const nodes = this.dataSource.value.nodes;
    const startIndex = nodes.indexOf(node);
    const results: FlatTreeModel<T, TypeDef>[] = [];

    // Goes through flattened tree nodes in the `dataNodes` array, and get all descendants.
    // The level of descendants of a tree node must be greater than the level of the given
    // tree node.
    // If we reach a node whose level is equal to the level of the tree node, we hit a sibling.
    // If we reach a node whose level is greater than the level of the tree node, we hit a
    // sibling of an ancestor.
    for (
      let i = startIndex + 1;
      i < nodes.length && node.level < nodes[i].level;
      i++
    ) {
      results.push(nodes[i]);
    }
    return results;
  }

  private static dataChanged<T = any, TypeDef extends string = string>(oldTree: FlatTreeModel<T, TypeDef>[], newTreeNodes: FlatTreeModel<T, TypeDef>[]) {
    const currentNodeIds = oldTree.map(node => node.id);
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

  public checkStateChanged(changedNodes: FlatTreeModel<T, TypeDef>[]) {
    changedNodes.forEach(node => this.checkedMap.set(node.id, node.checked));
    this.updateLevelCheckedCache(changedNodes);
    this.checkStateChangedSource.next(changedNodes);
  }

  public selectionStateChanged(node: FlatTreeModel<T, TypeDef>) {
    this.selectionStateChangedSource.next(node);
  }

  public toggleNodeExpanded(node: FlatTreeModel<T, TypeDef>) {
    // this.treeControl.toggle(node);
    this.nodeExpansionChangedSource.next({ expanded: node.expanded, node });
  }

  public nodePositionChanged(evt: NodePositionChangedEventModel) {
    this.nodePositionChangedSource.next(evt);
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private updateCaches(data: FlatTreeModel<T, TypeDef>[]) {
    this.checkedMap.clear();
    this.indeterminateMap.clear();
    this.nodesMap.clear();
    data.forEach(node => {
      this.nodesMap.set(node.id, node);
      if (!node.expandable) {
        this.checkedMap.set(node.id, node.checked);
      }
    });
    this.updateLevelCheckedCache(data);
  }

  private updateLevelCheckedCache(data: FlatTreeModel<T, TypeDef>[]) {
    data.forEach(node => {
      if (FlatTreeHelper.isExpandable(node)) {
        this.checkedMap.set(node.id, this.descendantsAllSelected(node));
        this.indeterminateMap.set(node.id, this.descendantsPartiallySelected(node));
      }
    });
  }

  private getCheckedState(node: FlatTreeModel<T, TypeDef>): boolean {
    if (FlatTreeHelper.isExpandable(node)) {
      return this.descendantsAllSelected(node);
    }
    return this.isChecked(node);
  }

  public descendantsAllSelected(node: FlatTreeModel<T, TypeDef>): boolean {
    const descendants = this.getDescendants(node);
    if (descendants.length === 0) {
      return false;
    }
    return descendants.every(child => this.getCheckedState(child));
  }

  public descendantsPartiallySelected(node: FlatTreeModel<T, TypeDef>): boolean {
    const descendants = this.getDescendants(node);
    const someChecked = descendants.some(child => this.getCheckedState(child));
    return someChecked && !this.checkedMap.get(node.id);
  }

  public isIndeterminate(node: FlatTreeModel<T, TypeDef>) {
    return this.indeterminateMap.get(node.id) || false;
  }

  public isChecked(node: FlatTreeModel<T, TypeDef>) {
    return this.checkedMap.get(node.id) || false;
  }

  public getNode(nodeId: string): FlatTreeModel<T, TypeDef> | undefined {
    return this.nodesMap.get(nodeId);
  }

}
