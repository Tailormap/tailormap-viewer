import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PanelResizerComponent } from './panel-resizer.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('ResizeHandleComponent', () => {
  let component: PanelResizerComponent;
  let fixture: ComponentFixture<PanelResizerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PanelResizerComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PanelResizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
