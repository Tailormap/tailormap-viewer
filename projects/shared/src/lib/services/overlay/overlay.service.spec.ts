import { OverlayService } from './overlay.service';
import { TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';
import { Injector } from '@angular/core';


describe('OverlayService', () => {
  let service: OverlayService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OverlayService,
        Overlay,
        Injector,
      ],
    });
    service = TestBed.inject(OverlayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

});
