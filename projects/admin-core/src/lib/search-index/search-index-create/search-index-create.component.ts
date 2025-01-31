import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SearchIndexModel, SearchIndexStatusEnum } from '@tailormap-admin/admin-api';
import { BehaviorSubject, take } from 'rxjs';
import { Router } from '@angular/router';
import { SearchIndexService } from '../services/search-index.service';

@Component({
  selector: 'tm-admin-search-index-create',
  templateUrl: './search-index-create.component.html',
  styleUrls: ['./search-index-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SearchIndexCreateComponent {

  public saveEnabled = signal(false);
  private updatedSearch: Pick<SearchIndexModel, 'name' | 'featureTypeId'> | undefined;

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  constructor(
    private searchIndexService: SearchIndexService,
    private router: Router,
  ) {
  }

  public validFormChanged($event: boolean) {
    this.saveEnabled.set($event);
  }

  public updateSearchIndex($event: { searchIndex: Pick<SearchIndexModel, 'name' | 'featureTypeId'> }) {
    this.updatedSearch = $event.searchIndex;
  }

  public save() {
    if (!this.updatedSearch) {
      return;
    }
    const searchIndexModel: Omit<SearchIndexModel, 'id'> = {
      name: this.updatedSearch.name,
      featureTypeId: this.updatedSearch.featureTypeId,
      searchFieldsUsed: [],
      searchDisplayFieldsUsed: [],
      status: SearchIndexStatusEnum.INITIAL,
      lastIndexed: null,
    };
    this.savingSubject.next(true);
    this.searchIndexService.createSearchIndex$(searchIndexModel)
      .pipe(take(1))
      .subscribe(createdSearchIndex => {
        if (createdSearchIndex) {
          this.router.navigateByUrl('/admin/search-indexes/search-index/' + createdSearchIndex.id);
        }
        this.savingSubject.next(false);
      });
  }

}
