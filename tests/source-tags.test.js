import {test,expect} from 'bun:test';
import {stripSourceTags} from '../lib/psylink/safety';

test('inline source ids offered to the model are removed; everything else is left alone',()=>{
  const ids=['paper-sleep','selfcare'];
  expect(stripSourceTags('A routine helped sleep. [paper-sleep] Try it tonight.',ids)).toBe('A routine helped sleep. Try it tonight.');
  expect(stripSourceTags('Rest matters [selfcare, paper-sleep].',ids)).toBe('Rest matters.');
  expect(stripSourceTags('研究发现规律作息有帮助【paper-sleep】。',ids)).toBe('研究发现规律作息有帮助。');
  expect(stripSourceTags('Say: "You wanted [one more book]." (really)',ids)).toBe('Say: "You wanted [one more book]." (really)');
  expect(stripSourceTags('See [unknown-id] and [paper-sleep, unknown-id].',ids)).toBe('See [unknown-id] and [paper-sleep, unknown-id].');
  expect(stripSourceTags('Nothing to strip [paper-sleep]',[])).toBe('Nothing to strip [paper-sleep]');
});
