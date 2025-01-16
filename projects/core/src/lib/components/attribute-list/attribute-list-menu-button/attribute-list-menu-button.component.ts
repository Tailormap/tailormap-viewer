import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectAttributeListPanelTitle, selectAttributeListVisible } from '../state/attribute-list.selectors';
import { setAttributeListVisibility } from '../state/attribute-list.actions';

@Component({
  selector: 'tm-attribute-list-button',
  templateUrl: './attribute-list-menu-button.component.html',
  styleUrls: ['./attribute-list-menu-button.component.css'],
  standalone: false,
})
export class AttributeListMenuButtonComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);
  public title$: Observable<string> = of('');

  constructor(
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.visible$ = this.store$.select(selectAttributeListVisible);
    this.title$ = this.store$.select(selectAttributeListPanelTitle);
  }

  public toggleAttributeList() {
    this.store$.dispatch(setAttributeListVisibility({}));
  }

}
