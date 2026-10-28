import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import {
  validateTaskId,
  resolveSafeWorktreePath,
  parseUnifiedDiff,
  WorkspaceService,
} from '../src/lib/workspaceService.js';

describe('Safe Autonomous Coding Workspace (Milestone 1)', () => {
  const repoRoot = process.cwd();
  let workspaceService: WorkspaceService;
  const testTaskId = `test-worktree-${Date.now()}`;

  before(async () => {
    workspaceService = new WorkspaceService(repoRoot);
    await workspaceService.ensureGitRepo();
  });

  after(async () => {
    try {
      await workspaceService.discardWorkspace(testTaskId, 'test-cleanup');
    } catch (_) {
      // ignore
    }
  });

  describe('Security Boundary: Task ID and Path Traversal Validation', () => {
    test('accepts valid alphanumeric, dashed, and underscored task IDs', () => {
      assert.strictEqual(validateTaskId('task-101'), true);
      assert.strictEqual(validateTaskId('fix_issue_99'), true);
      assert.strictEqual(validateTaskId('increase-test-coverage'), true);
    });

    test('rejects path traversal attempts in taskId', () => {
      assert.strictEqual(validateTaskId('../etc/passwd'), false);
      assert.strictEqual(validateTaskId('..\\windows\\system32'), false);
      assert.strictEqual(validateTaskId('foo/bar'), false);
      assert.strictEqual(validateTaskId('task\0null'), false);
      assert.strictEqual(validateTaskId(''), false);
      assert.strictEqual(validateTaskId('a'), false); // too short (<3)
    });

    test('resolveSafeWorktreePath prevents directory escape', () => {
      assert.throws(() => {
        resolveSafeWorktreePath(repoRoot, '../../etc');
      }, /Invalid taskId format/);
    });
  });

  describe('Pure Unified Diff Parser', () => {
    test('accurately parses standard git unified diff with additions and deletions', () => {
      const sampleDiff = `diff --git a/src/sample.ts b/src/sample.ts
index 1111111..2222222 100644
--- a/src/sample.ts
+++ b/src/sample.ts
@@ -1,4 +1,5 @@
 const x = 1;
-const y = 2;
+const y = 3;
+const z = 4;
 export { x, y };
`;
      const parsed = parseUnifiedDiff(sampleDiff);
      assert.strictEqual(parsed.length, 1);
      assert.strictEqual(parsed[0].file, 'src/sample.ts');
      assert.strictEqual(parsed[0].additions, 2);
      assert.strictEqual(parsed[0].deletions, 1);
      assert.strictEqual(parsed[0].hunks.length, 1);
      assert.strictEqual(parsed[0].hunks[0].lines.length, 5);
      assert.strictEqual(parsed[0].hunks[0].lines[1].type, 'deletion');
      assert.strictEqual(parsed[0].hunks[0].lines[2].type, 'addition');
    });

    test('handles empty or blank diff gracefully', () => {
      const parsed = parseUnifiedDiff('');
      assert.deepStrictEqual(parsed, []);
    });
  });

  describe('Isolated Worktree Lifecycle & Confinement', () => {
    test('creates isolated worktree without touching main repository files', async () => {
      const created = await workspaceService.createWorkspace({
        taskId: testTaskId,
        title: 'Increase Safe Engine Test Coverage',
        baseBranch: 'main',
        actor: 'test-runner',
      });

      assert.strictEqual(created.taskId, testTaskId);
      assert.strictEqual(created.branch, `feat/${testTaskId}`);
      assert.strictEqual(created.status, 'CREATED');
      assert.strictEqual(fs.existsSync(created.worktreePath), true);
    });

    test('applies code change inside isolated worktree and generates exact diff', async () => {
      const testContent = `// Isolated patch for ${testTaskId}\nexport const isolatedValue = 42;\n`;
      await workspaceService.updateFileInWorktree(
        testTaskId,
        'src/lib/temp_isolated_test.ts',
        testContent,
        `feat(${testTaskId}): add isolated test module`
      );

      const inspected = await workspaceService.inspectWorkspace(testTaskId);
      assert.strictEqual(inspected.status, 'EDITED');
      assert.ok(inspected.changedFiles.some((f) => f.includes('temp_isolated_test.ts')));

      const diff = await workspaceService.generateDiff(testTaskId);
      assert.ok(diff.rawDiff.includes('isolatedValue = 42'));
      assert.ok(diff.parsedDiff.length > 0);
    });

    test('runs whitelisted test command inside worktree and captures exit code', async () => {
      const testResult = await workspaceService.runWorkspaceTests(testTaskId, 'unit-tests');
      console.log('ACTUAL STDOUT:', JSON.stringify(testResult.stdout));
      assert.strictEqual(typeof testResult.exitCode, 'number');
      assert.strictEqual(testResult.passed, true);
      assert.ok(testResult.durationMs >= 0);
    });

    test('rejects unwhitelisted arbitrary shell commands', async () => {
      await assert.rejects(async () => {
        await workspaceService.runWorkspaceTests(testTaskId, 'rm -rf /');
      }, /not whitelisted/);
    });

    test('records audit trail for workspace actions', () => {
      const audit = workspaceService.getAuditTrail(testTaskId);
      assert.ok(audit.length >= 2);
      const actions = audit.map((a) => a.action);
      assert.ok(actions.includes('CREATE'));
      assert.ok(actions.includes('RUN_TESTS'));
    });

    test('discards isolated worktree and cleans up feature branch', async () => {
      const result = await workspaceService.discardWorkspace(testTaskId, 'test-cleanup');
      assert.strictEqual(result.success, true);

      const expectedPath = path.resolve(repoRoot, '.worktrees', testTaskId);
      assert.strictEqual(fs.existsSync(expectedPath), false);
    });

    test('acceptWorkspace applies changes and merges cleanly into base branch', async () => {
      const acceptTaskId = `test-accept-${Date.now()}`;
      await workspaceService.createWorkspace({
        taskId: acceptTaskId,
        title: 'Acceptance merge test',
        baseBranch: 'main',
        actor: 'reviewer-test',
      });

      await workspaceService.updateFileInWorktree(
        acceptTaskId,
        'src/lib/temp_accepted_patch.ts',
        '// Accepted patch\nexport const patchApplied = true;\n',
        'feat: test accepted patch'
      );

      const acceptRes = await workspaceService.acceptWorkspace(acceptTaskId, 'reviewer-test');
      assert.strictEqual(acceptRes.success, true);

      // Verify file is now present in root repository
      const rootFilePath = path.resolve(repoRoot, 'src/lib/temp_accepted_patch.ts');
      assert.strictEqual(fs.existsSync(rootFilePath), true);

      // Clean up test file from main branch
      fs.unlinkSync(rootFilePath);
      const { spawnSecureProcess } = await import('../src/lib/workspaceService.js');
      await spawnSecureProcess('git', ['add', 'src/lib/temp_accepted_patch.ts'], { cwd: repoRoot });
      await spawnSecureProcess('git', ['commit', '-m', 'chore: cleanup test patch'], { cwd: repoRoot });
    });
  });
});
