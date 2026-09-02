import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GroupModel } from '@tailormap-admin/admin-api';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { GroupService } from '../services/group.service';
import { ListFilterComponent } from '../../shared/components/list-filter/list-filter.component';
import { MatSelectionList, MatListItem } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-admin-group-list',
    templateUrl: './group-list.component.html',
    styleUrls: ['./group-list.component.css'],
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
export class GroupListComponent {
  private groupDetailsService = inject(GroupService);


  public filteredGroups$: Observable<Array<GroupModel & { selected: boolean }>>;
  public groupFilter: FormControl;
  public filterString$: Observable<string>;

  constructor() {
    this.groupFilter = new FormControl('');
    this.filterString$ = this.groupFilter.valueChanges.pipe(startWith(''));
    this.filteredGroups$ = combineLatest([
      this.groupDetailsService.getGroups$(),
      this.filterString$,
      this.groupDetailsService.selectedGroup$,
    ]).pipe(
      map(([ groups, filterString, selectedGroup ]) => {
        return groups
          .filter(group => group.name.toLowerCase().indexOf(filterString.toLowerCase()) !== -1)
          .map(group => ({
            ...group,
            selected: !!(selectedGroup && group.name === selectedGroup),
          }));
      }));
  }

}
