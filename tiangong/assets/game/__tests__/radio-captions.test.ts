import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {test} from 'vitest';
import {RADIO_CAPTIONS, RADIO_DURATION, radioLine} from '../radio-captions.ts';
import {NativeGame, idleControls} from '../simulation.ts';
import * as R from '../rules.js';

const original = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../../japanese-radio.json', import.meta.url)), 'utf8'),
) as {lines: Record<string, {caption: string; seconds: number}>};

const ground = {
  floor: () => 0,
  nearest: (x: number, z: number) => ({x, z, floorY: 0}),
  move: (p: any, x: number, y: number, z: number) => ({x: p.x + x, z: p.z + z, y: Math.max(0, p.y + y), grounded: p.y + y <= 0}),
  ray: () => null,
  path: () => [],
};

test('all five Japanese radio lines keep the original Chinese captions and duration', () => {
  for (let stage = 2; stage <= 6; stage++) {
    const line = radioLine(stage)!;
    assert.equal(line, `radio${stage}`);
    assert.equal(RADIO_CAPTIONS[stage], original.lines[line].caption);
    assert(Math.abs(RADIO_DURATION[stage] - original.lines[line].seconds) < 0.02);
  }
  assert.equal(radioLine(1), undefined);
  assert.equal(radioLine(7), undefined);
});

test('an alert stage rise emits the matching radio line with its caption', () => {
  const g = new NativeGame(ground as any);
  g.mode = 'playing';
  g.state.pending = 0;
  g.state.xpEarned = 30;
  g.update(0.016, idleControls());
  const radio = g.events.find(e => e.kind === 'radio');
  assert(radio);
  assert.equal(radio.stage, 2);
  assert.equal(radio.line, 'radio2');
  assert.equal(radio.caption, original.lines.radio2.caption);
});

test('world effects carry positions for spatial audio', () => {
  const g = new NativeGame(ground as any);
  g.explode(3, 1, 4, 2, 10, 0);
  const explosion = g.events.find(e => e.kind === 'explosion');
  assert(explosion);
  assert.deepEqual([explosion.x, explosion.y, explosion.z], [3, 1, 4]);
});

test('settlement stats read only rule-state fields owned by v0.3.76', () => {
  const s: any = (R as any).makeState();
  for (const key of ['peakAlert', 'maxChain', 'purifiers', 'highestEnemy', 'cityInfected', 'towers', 'destroyed', 'first', 'history']) assert(key in s);
  (R as any).hurtMother(s, 10, '测试', false);
  assert(Array.isArray(s.damageLog));
  assert.equal((R as any).POPULATION, 58);
  assert.equal((R as any).ALERT_NAMES[5], '开启计时');
});
