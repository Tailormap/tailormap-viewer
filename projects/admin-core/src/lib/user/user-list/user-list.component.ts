import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserModel } from '@tailormap-admin/admin-api';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { ListFilterComponent } from '../../shared/components/list-filter/list-filter.component';
import { MatSelectionList, MatListItem } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-admin-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ListFilterComponent,
        ReactiveFormsModule,
        MatSelectionList,
        MatListItem,
        RouterLink,
        AsyncPipe,
    ],
})
export class UserListComponent {
  private userDetailsService = inject(UserService);

  public filteredUsers$: Observable<Array<UserModel & { selected: boolean }>>;
  public userFilter: FormControl;
  public filterString$: Observable<string>;

  constructor() {
    this.userFilter = new FormControl('');
    this.filterString$ = this.userFilter.valueChanges.pipe(startWith(''));

    this.filteredUsers$ = combineLatest([
      this.userDetailsService.getUsers$(),
      this.filterString$,
      this.userDetailsService.selectedUser$,
    ]).pipe(
      map(([ users, filterString, selectedUser ]) => {
        return users
          .filter(user => {
            const t = filterString.toLowerCase();
            return user.username.toLowerCase().includes(t)
                || user.organisation?.toLowerCase().includes(t);
          })
          .map(user => ({
            ...user,
            selected: !!(selectedUser && user.username === selectedUser),
          }));
      }),
    );
  }

}
