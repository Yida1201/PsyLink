import {test,expect} from 'bun:test';
import {showsReviewLabel} from '../lib/together/review-label';

test('the draft notice is hidden only inside a verified test session; reviewed content always shows its status',()=>{
  expect(showsReviewLabel('draft',false)).toBe(true);
  expect(showsReviewLabel('draft',undefined)).toBe(true);
  expect(showsReviewLabel('draft',true)).toBe(false);
  expect(showsReviewLabel('reviewed',true)).toBe(true);
  expect(showsReviewLabel('reviewed',false)).toBe(true);
  expect(showsReviewLabel('anything-else',true)).toBe(false);
});
