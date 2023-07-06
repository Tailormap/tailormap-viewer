import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { FormHelper } from '../../helpers/form.helper';

@Component({
  selector: 'tm-admin-catalog-node-form',
  templateUrl: './catalog-node-form.component.html',
  styleUrls: ['./catalog-node-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogNodeFormComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private _node: ExtendedCatalogNodeModel | null = null;

  @Input()
  public set node(node: ExtendedCatalogNodeModel | null) {
    this.catalogNodeForm.patchValue({
      title: node ? node.title : '',
    });
    this._node = node;
  }

  @Input()
  public parentNode: string | null = null;

  @Output()
  public changed = new EventEmitter<Omit<ExtendedCatalogNodeModel, 'id'> | null>();

  public catalogNodeForm = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
  });

  public ngOnInit(): void {
    this.catalogNodeForm.valueChanges
      .pipe(
        takeUntil(this.destroyed),
        debounceTime(250),
      )
      .subscribe(value => {
        if (!this.parentNode) {
          // Parent node is required
          return;
        }
        if (!this.isValidForm()) {
          this.changed.emit(null);
          return;
        }
        this.changed.emit({
          title: value.title || '',
          parentId: this.parentNode,
          root: false,
          children: this._node?.children || null,
          items: this._node?.items || null,
        });
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  private isValidForm() {
    const values = this.catalogNodeForm.getRawValue();
    return FormHelper.isValidValue(values.title)
    && this.catalogNodeForm.dirty;
  }

}
