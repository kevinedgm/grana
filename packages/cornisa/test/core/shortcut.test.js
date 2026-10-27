import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseShortcut } from '../../src/index.js';

test('parseShortcut: exige modificador (WCAG 2.1.4) y empareja por código físico', () => {
  assert.throws(() => parseShortcut('N'), /Alt, Ctrl or Meta/);
  assert.throws(() => parseShortcut('Shift+N'), /Alt, Ctrl or Meta/);
  assert.throws(() => parseShortcut('Hyper+N'), /invalid/);
  assert.throws(() => parseShortcut(''), TypeError);
  const s = parseShortcut('alt+shift+n');
  assert.equal(s.aria, 'Alt+Shift+N');
  const ev = (o) => ({ altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, key: 'x', code: 'KeyX', ...o });
  assert.equal(s.matches(ev({ altKey: true, shiftKey: true, key: 'Ñ', code: 'KeyN' })), true, 'Alt cambia e.key en macOS: se usa e.code');
  assert.equal(s.matches(ev({ altKey: true, key: 'n', code: 'KeyN' })), false, 'falta Shift');
  assert.equal(s.matches(ev({ altKey: true, shiftKey: true, ctrlKey: true, code: 'KeyN' })), false, 'modificador de más');
  assert.equal(parseShortcut('Ctrl+.').matches(ev({ ctrlKey: true, key: '.' })), true);
});
