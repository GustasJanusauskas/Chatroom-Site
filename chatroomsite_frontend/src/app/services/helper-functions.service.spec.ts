import { TestBed } from '@angular/core/testing';

import { HelperFunctionsService } from './helper-functions.service';

describe('HelperFunctionsService', () => {
  let service: HelperFunctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HelperFunctionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate random strings', () => {
    expect(HelperFunctionsService.randomString(50)).not.toBe(HelperFunctionsService.randomString(100));
  });
});
