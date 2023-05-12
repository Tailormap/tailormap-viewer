import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { GroupModel } from '@tailormap-admin/admin-api';
import { Router } from '@angular/router';
import { GroupDetailsService } from '../services/group-details.service';

@Component({
  selector: 'tm-admin-group-create',
  templateUrl: './group-create.component.html',
  styleUrls: ['./group-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupCreateComponent implements OnInit, OnDestroy {

  private savingSubject = new BehaviorSubject(false);
  private destroyed = new Subject();

  public saving$ = this.savingSubject.asObservable();
  public group: Omit<GroupModel, 'id'> | null = null;

  constructor(
    private groupDetailsService: GroupDetailsService,
    private router: Router,
  ) { }

  public ngOnInit(): void {
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateGroup($event: Omit<GroupModel, 'id'>) {
    this.group = $event;
  }

  public save() {
    if (!this.group) {
      return;
    }
    this.savingSubject.next(true);
    this.groupDetailsService.addOrUpdateGroup$(true, this.group)
      .pipe(takeUntil(this.destroyed))
      .subscribe(createGroup => {
        if (createGroup) {
          this.router.navigateByUrl('/groups/group/' + createGroup.name);
        }
        this.savingSubject.next(false);
      });
  }
}
