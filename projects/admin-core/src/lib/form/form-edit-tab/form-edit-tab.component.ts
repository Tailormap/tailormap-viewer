import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { debounceTime, filter } from 'rxjs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AutoFocusDirective } from '@tailormap-viewer/shared';
import { selectDraftFormField, selectDraftFormSelectedTab, selectDraftFormTabs } from '../state/form.selectors';
import { draftFormUpdateFields, draftFormUpdateTabs } from '../state/form.actions';
import { MatButton } from '@angular/material/button';

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
    MatButton,
  ],
})
export class FormEditTabComponent {
  private store$ = inject(Store);

  public tab = this.store$.selectSignal(selectDraftFormSelectedTab);
  private tabs = this.store$.selectSignal(selectDraftFormTabs);
  private fields = this.store$.selectSignal(selectDraftFormField);

  public tabForm = new FormGroup({
    label: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const tab = this.tab();
      this.tabForm.reset({ label: tab?.label ?? '' }, { emitEvent: false });
    });

    this.tabForm.controls.label.valueChanges
      .pipe(
        takeUntilDestroyed(),
        debounceTime(250),
        filter(() => this.tabForm.dirty),
      )
      .subscribe(label => this.updateLabel(label));
  }

  private updateLabel(label: string) {
    const selected = this.tab();
    if (!selected || !label) {
      return;
    }
    const tabs = this.tabs().map(t => t.id === selected.id ? { ...t, label } : t);
    this.store$.dispatch(draftFormUpdateTabs({ tabs }));
  }

  public deleteTab(): void {
    const selected = this.tab();
    if (!selected) {
      return;
    }
    const fields = this.fields();
    const tabs = this.tabs().filter(t => t.id !== selected.id);
    const updatedFields = fields
      .map(f => {
        if (f.tab === selected.id) {
          return { ...f, tab: tabs[0]?.id };
        }
        return f;
      });

    this.store$.dispatch(draftFormUpdateFields({ fields: updatedFields }));
    this.store$.dispatch(draftFormUpdateTabs({ tabs }));
  }

}
