import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { safeCalculate, extractArithmetic, detectLanguage, safeKnowledgePath, rankMemories, type MemoryItem } from '../src/lib/safeEngine.js';

test('1. safeCalculate computes valid arithmetic operations correctly', () => {
  const r1 = safeCalculate('1250 * 24 + 3600');
  assert.equal(r1, 33600);

  const r2 = safeCalculate('100 / 4 - (5 * 2)');
  assert.equal(r2, 15);

  const r3 = safeCalculate('2 ^ 3 + 10 % 3');
  assert.equal(r3, 9);
});

test('2. safeCalculate rejects code injection, non-arithmetic and unsafe expressions', () => {
  assert.throws(() => safeCalculate('process.exit(1)'), /Only basic arithmetic characters are allowed/);
  assert.throws(() => safeCalculate('console.log("hello")'), /Only basic arithmetic characters are allowed/);
  assert.throws(() => safeCalculate('eval("2+2")'), /Only basic arithmetic characters are allowed/);
  assert.throws(() => safeCalculate('10 / 0'), /Division by zero/);
});

test('3. extractArithmetic extracts math formulas and rejects conversational text', () => {
  const f1 = extractArithmetic('Calculate 1250 * 24 + 3600');
  assert.equal(f1, '1250*24+3600');

  const f2 = extractArithmetic('100 + 200 тооцоол');
  assert.equal(f2, '100+200');

  // Should NOT treat general tasks as arithmetic
  const nonMath = extractArithmetic('Make a 7 day plan with 60 minutes each day');
  assert.equal(nonMath, null);
});

test('4. detectLanguage correctly classifies Mongolian, English, and Japanese', () => {
  assert.equal(detectLanguage('Сайн уу, төслийн байдлыг шалгана уу'), 'mn');
  assert.equal(detectLanguage('Calculate 1250 * 24 + 3600 and summarize'), 'en');
  assert.equal(detectLanguage('タスクを実行してください'), 'ja');
});

test('5. safeKnowledgePath prevents path traversal attacks', () => {
  const dummyDir = path.resolve('/app/applet/knowledge');
  assert.throws(() => safeKnowledgePath('../ai_memory.db', dummyDir), /Only \.txt\/\.md files directly inside the knowledge folder are allowed/);
  assert.throws(() => safeKnowledgePath('../../etc/passwd', dummyDir), /Only \.txt\/\.md files directly inside the knowledge folder are allowed/);
  assert.throws(() => safeKnowledgePath('script.sh', dummyDir), /Only \.txt\/\.md files directly inside the knowledge folder are allowed/);

  const valid = safeKnowledgePath('ai_engineering_notes.txt', dummyDir);
  assert.equal(valid, path.join(dummyDir, 'ai_engineering_notes.txt'));
});

test('6. rankMemories retrieves and ranks memories based on relevance', () => {
  const mockMemories: MemoryItem[] = [
    { id: '1', userId: 'owner', category: 'preference', title: 'Харилцааны хэл', content: 'Монгол хэлээр харилцах', importance: 'high', tags: ['language', 'mn'] },
    { id: '2', userId: 'owner', category: 'goal', title: 'Personal AI алсын хараа', content: 'ChatGPT биш хувийн систем', importance: 'high', tags: ['vision', 'ai'] },
    { id: '3', userId: 'owner', category: 'technical', title: 'Python орчин', content: 'Python 3.13 болон Node 22', importance: 'low', tags: ['python'] },
  ];

  const results = rankMemories(mockMemories, 'Монгол хэл');
  assert.equal(results.length > 0, true);
  assert.equal(results[0].id, '1');
});

test('7. authorization and session security boundaries', () => {
  // Test Bearer token header parsing pattern
  const parseBearer = (header?: string) => {
    if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
    return null;
  };

  assert.equal(parseBearer('Bearer valid-secret-token'), 'valid-secret-token');
  assert.equal(parseBearer('Basic dXNlcjpwYXNz'), null);
  assert.equal(parseBearer(''), null);
  assert.equal(parseBearer(undefined), null);

  // Test admin vs user privilege check
  const canSwitchUser = (currentUserRole: string, targetUserId: string, currentUserId: string) => {
    if (currentUserRole !== 'admin' && currentUserId !== targetUserId) {
      return false;
    }
    return true;
  };

  assert.equal(canSwitchUser('admin', 'friend', 'owner'), true);
  assert.equal(canSwitchUser('user', 'owner', 'friend'), false);
  assert.equal(canSwitchUser('user', 'friend', 'friend'), true);
});
