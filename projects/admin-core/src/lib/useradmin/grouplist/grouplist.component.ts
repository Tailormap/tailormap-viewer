import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { GroupModel } from '@tailormap-admin/admin-api';
import { combineLatest, map, Observable, startWith, Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { GroupdetailsService } from '../services/groupdetails.service';

@Component({
  selector: 'tm-admin-grouplist',
  templateUrl: './grouplist.component.html',
  styleUrls: ['./grouplist.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrouplistComponent implements OnInit, OnDestroy {
  public filteredGroups$: Observable<GroupModel[]>;
  public groupFilter: FormControl;
  public filterString$: Observable<string>;
  private destroyed = new Subject();

  constructor(private groupDetailsService: GroupdetailsService) {
    this.groupFilter = new FormControl('');
    this.filterString$ = this.groupFilter.valueChanges.pipe(startWith(''));
    this.filteredGroups$ = combineLatest([
      this.groupDetailsService.groupList$,
      this.filterString$,
    ]).pipe(
      map(([ groups, filterString ]) => groups.filter(group => group.name.toLowerCase().indexOf(filterString.toLowerCase()) !== -1)));
  }

  public ngOnInit(): void {
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public onSelect(selectedName: string): void {
    this.groupDetailsService.selectGroup(selectedName);
  }
}
