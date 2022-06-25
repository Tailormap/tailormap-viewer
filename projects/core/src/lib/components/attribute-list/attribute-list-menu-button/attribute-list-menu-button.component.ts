import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectAttributeListVisible } from '../state/attribute-list.selectors';
import { setAttributeListVisibility } from '../state/attribute-list.actions';

@Component({
  selector: 'tm-attribute-list-button',
  templateUrl: './attribute-list-menu-button.component.html',
  styleUrls: ['./attribute-list-menu-button.component.css'],
})
export class AttributeListMenuButtonComponent implements OnInit {

  public visible$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.visible$ = this.store$.select(selectAttributeListVisible);
  }

  public toggleAttributeList() {
    this.store$.dispatch(setAttributeListVisibility({}));
  }

}
