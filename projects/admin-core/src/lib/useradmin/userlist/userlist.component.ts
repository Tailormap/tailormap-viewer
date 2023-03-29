import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { UserModel } from '@tailormap-admin/admin-api';
import { combineLatest, map, Observable, startWith, Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { UserDetailsService } from '../services/userdetails.service';

@Component({
  selector: 'tm-admin-userlist',
  templateUrl: './userlist.component.html',
  styleUrls: ['./userlist.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserlistComponent implements OnInit, OnDestroy {
  public filteredUsers$: Observable<UserModel[]>;
  public userFilter: FormControl;
  public filterString$: Observable<string>;
  private destroyed = new Subject();

  constructor(
    private userDetailsService: UserDetailsService) {
    this.userFilter = new FormControl('');
    this.filterString$ = this.userFilter.valueChanges.pipe(startWith(''));

    this.filteredUsers$ = combineLatest([
      this.userDetailsService.userList$,
      this.filterString$,
    ]).pipe(
      map(([ users, filterString ]) =>
        users.filter(user => user.username.toLowerCase().indexOf(filterString.toLowerCase()) !== -1)),
    );
  }

  public ngOnInit(): void {
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public onSelectUser(selectedUserName: string): void {
    this.userDetailsService.selectUser(selectedUserName);
  }

}
