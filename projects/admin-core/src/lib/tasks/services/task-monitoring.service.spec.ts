
import { TestBed } from '@angular/core/testing';
import { TaskMonitoringService } from './task-monitoring.service';

describe('TaskMonitoringService', () => {

  let service: TaskMonitoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ TaskMonitoringService ],
    });
    service = TestBed.inject(TaskMonitoringService);
  });

  test('should...', () => {
    expect(service).toBeTruthy();
  });

});
