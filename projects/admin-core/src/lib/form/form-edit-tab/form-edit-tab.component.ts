import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { debounceTime, filter } from 'rxjs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AutoFocusDirective } from '@tailormap-viewer/shared';
import { selectDraftFormSelectedTab, selectDraftFormTabs } from '../state/form.selectors';
import { draftFormUpdateTabs } from '../state/form.actions';

@Component({
  selector: 'tm-admin-form-edit-tab',
  templateUrl: './form-edit-tab.component.html',
  styleUrls: ['./form-edit-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    AutoFocusDirective,
  ],
})
export class FormEditTabComponent {
  private store$ = inject(Store);

  public tab = this.store$.selectSignal(selectDraftFormSelectedTab);
  private tabs = this.store$.selectSignal(selectDraftFormTabs);

  public tabForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const tab = this.tab();
      this.tabForm.reset({ name: tab?.name ?? '' }, { emitEvent: false });
    });

    this.tabForm.controls.name.valueChanges
      .pipe(
        takeUntilDestroyed(),
        debounceTime(250),
        filter(() => this.tabForm.dirty),
      )
      .subscribe(name => this.updateName(name));
  }

  private updateName(name: string) {
    const selected = this.tab();
    if (!selected || !name) {
      return;
    }
    const tabs = this.tabs().map(t => t.id === selected.id ? { ...t, name } : t);
    this.store$.dispatch(draftFormUpdateTabs({ tabs }));
  }

}
