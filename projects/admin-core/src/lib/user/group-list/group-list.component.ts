import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GroupModel } from '@tailormap-admin/admin-api';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import { FormControl } from '@angular/forms';
import { GroupDetailsService } from '../services/group-details.service';

@Component({
  selector: 'tm-admin-group-list',
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupListComponent {

  public filteredGroups$: Observable<Array<GroupModel & { selected: boolean }>>;
  public groupFilter: FormControl;
  public filterString$: Observable<string>;

  constructor(private groupDetailsService: GroupDetailsService) {
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
            selected: !!(selectedGroup && group.name === selectedGroup.name),
          }));
      }));
  }

}
