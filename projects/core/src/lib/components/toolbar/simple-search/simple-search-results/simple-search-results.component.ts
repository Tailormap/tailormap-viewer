import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output } from '@angular/core';
import { SearchResultModel } from '../models';

type SearchStatusType = 'empty' | 'no_results' | 'searching' | 'belowMinLength' | 'complete';

@Component({
  selector: 'tm-simple-search-results',
  templateUrl: './simple-search-results.component.html',
  styleUrls: ['./simple-search-results.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SimpleSearchResultsComponent {


  @Input()
  public searchResults: SearchResultModel[] | null = null;

  @Input()
  public searchStatus: SearchStatusType = 'empty';

  @Output()
  public scrolledToGroup = new EventEmitter();

  public minLength = 3;

  public scrollTo($event: MouseEvent, id: string) {
    $event.stopPropagation();
    $event.preventDefault();
    const targetGroup = `search-group-${id}`;
    const target = document.getElementById(targetGroup);
    this.scrolledToGroup.emit();
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
