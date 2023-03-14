import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, filter, Subject, takeUntil } from 'rxjs';
import { GroupModel } from '@tailormap-admin/admin-api';
import { GroupdetailsService } from '../services/groupdetails.service';

@Component({
  selector: 'tm-admin-groupdetails-form',
  templateUrl: './groupdetails-form.component.html',
  styleUrls: ['./groupdetails-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupdetailsFormComponent implements OnInit, OnDestroy {
  public existingGroup = false;

  public groupdetailsForm = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    description: new FormControl<string>('', { nonNullable: false }),
    notes: new FormControl<string>('', { nonNullable: false }),
    systemGroup: new FormControl<boolean>(false, { nonNullable: true }),
  });
  private destroyed = new Subject();
  private _group: GroupModel | null = null;

  constructor(private groupDetailsService: GroupdetailsService) {
  }

  public ngOnInit(): void {
    this.groupdetailsForm.valueChanges.pipe(
      takeUntil(this.destroyed),
      debounceTime(250),
      filter(() => this.groupdetailsForm.valid))
      .subscribe(() => this.readForm());

    this.groupDetailsService.selectedGroup$.pipe(
      takeUntil(this.destroyed))
      .subscribe(group => {
        this._group = group;
        this.groupdetailsForm.patchValue({
          name: group ? group.name : '',
          description: group ? group.description : '',
          notes: group ? group.notes : null,
          systemGroup: group ? group.systemGroup : false,
        });
        this.existingGroup = group?.name.length > 0;
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public clearForm() {
    this.groupdetailsForm.reset({
      name: '',
      description: '',
      notes: '',
      systemGroup: false,
    });
    this.existingGroup = false;
    this._group = null;
  }


  public delete() {
    if (this._group) {
      this.groupDetailsService.deleteGroup(this._group);
      this.clearForm();
    }
  }

  public addOrUpdate() {
    if (this._group) {
      this.groupDetailsService.addOrUpdateGroup(!this.existingGroup, this._group);
      this.clearForm();
    }
  }

  private readForm() {
    this._group = {
      name: this.groupdetailsForm.get('name')?.value || '',
      description: this.groupdetailsForm.get('description')?.value || null,
      notes: this.groupdetailsForm.get('notes')?.value || null,
      systemGroup: this.groupdetailsForm.get('systemGroup')?.value || false,
    };
  }
}
