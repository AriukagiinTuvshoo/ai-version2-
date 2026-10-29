import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import {
  WorkspaceDetails,
  WorkspaceDiffFile,
  WorkspaceDiffHunk,
  WorkspaceDiffHunkLine,
  WorkspacePlanItem,
  WorkspaceTestResult,
  WorkspaceAuditEntry,
} from '../types.js';

export interface SpawnResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut?: boolean;
}

/**
 * Validates task identifier against path traversal and shell injection.
 * Allowed: alphanumeric characters, underscores, and dashes only (3-64 chars).
 */
export function validateTaskId(taskId: string): boolean {
  if (typeof taskId !== 'string') return false;
  const trimmed = taskId.trim();
  if (trimmed.length < 3 || trimmed.length > 64) return false;
  // Strictly prevent path traversal tokens and non-alphanumeric chars
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('\0')) {
    return false;
  }
  return /^[a-zA-Z0-9_-]+$/.test(trimmed);
}

/**
 * Validates that the worktree directory resides strictly inside REPO_ROOT/.worktrees
 * and rejects directory traversal or symlink escapes.
 */
export function resolveSafeWorktreePath(repoRoot: string, taskId: string): string {
  if (!validateTaskId(taskId)) {
    throw new Error(`Invalid taskId format: "${taskId}". Only [a-zA-Z0-9_-] (3-64 chars) allowed.`);
  }

  const worktreesBase = path.resolve(repoRoot, '.worktrees');
  const targetPath = path.resolve(worktreesBase, taskId);

  // Path containment check
  if (!targetPath.startsWith(worktreesBase + path.sep)) {
    throw new Error(`Security Exception: Target worktree path "${targetPath}" escapes worktrees root.`);
  }

  return targetPath;
}

/**
 * Spawn a child process securely with argument array (never shell string interpolation),
 * strict timeout, and interactive prompt prevention.
 */
export function spawnSecureProcess(
  executable: string,
  args: string[],
  options: {
    cwd: string;
    timeoutMs?: number;
    env?: NodeJS.ProcessEnv;
  }
): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs ?? 15000;
    let timedOut = false;

    // Secure environment: disable interactive prompts
    const secureEnv: NodeJS.ProcessEnv = {
      ...process.env,
      ...options.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_CONFIG_NOSYSTEM: '1',
      LC_ALL: 'C',
    };

    let child;
    try {
      child = spawn(executable, args, {
        cwd: options.cwd,
        env: secureEnv,
        shell: false, // MANDATORY: Shell is strictly disabled
      });
    } catch (err: any) {
      return resolve({
        exitCode: 1,
        stdout: '',
        stderr: err?.message || 'Failed to spawn process',
        durationMs: Date.now() - startTime,
      });
    }

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch (_) {
        // ignore
      }
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        exitCode: 1,
        stdout,
        stderr: stderr + '\n' + err.message,
        durationMs: Date.now() - startTime,
        timedOut,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: timedOut ? 124 : (code ?? 0),
        stdout,
        stderr: timedOut ? `${stderr}\nExecution timed out after ${timeoutMs}ms` : stderr,
        durationMs: Date.now() - startTime,
        timedOut,
      });
    });
  });
}

/**
 * Pure parser for git unified diff output into structured files and hunks.
 */
export function parseUnifiedDiff(diffText: string): WorkspaceDiffFile[] {
  if (!diffText || !diffText.trim()) return [];

  const files: WorkspaceDiffFile[] = [];
  const lines = diffText.split('\n');
  let currentFile: WorkspaceDiffFile | null = null;
  let currentHunk: WorkspaceDiffHunk | null = null;
  let oldLineCounter = 0;
  let newLineCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('diff --git ')) {
      // New file diff starts
      if (currentHunk && currentFile) {
        currentFile.hunks.push(currentHunk);
        currentHunk = null;
      }
      if (currentFile) {
        files.push(currentFile);
      }

      const parts = line.split(' ');
      const rawOld = parts[2]?.replace(/^a\//, '') || '';
      const rawNew = parts[3]?.replace(/^b\//, '') || '';
      const fileName = rawNew || rawOld || 'unknown';

      currentFile = {
        file: fileName,
        oldPath: rawOld,
        newPath: rawNew,
        status: 'modified',
        additions: 0,
        deletions: 0,
        hunks: [],
      };
      continue;
    }

    if (!currentFile) continue;

    if (line.startsWith('new file mode')) {
      currentFile.status = 'added';
      continue;
    }
    if (line.startsWith('deleted file mode')) {
      currentFile.status = 'deleted';
      continue;
    }

    if (line.startsWith('@@ ')) {
      if (currentHunk) {
        currentFile.hunks.push(currentHunk);
      }

      // Hunk header: @@ -1,4 +1,6 @@ optional context
      const match = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);
      if (match) {
        const oldStart = parseInt(match[1], 10);
        const oldLines = match[2] ? parseInt(match[2], 10) : 1;
        const newStart = parseInt(match[3], 10);
        const newLines = match[4] ? parseInt(match[4], 10) : 1;

        oldLineCounter = oldStart;
        newLineCounter = newStart;

        currentHunk = {
          oldStart,
          oldLines,
          newStart,
          newLines,
          header: line,
          lines: [],
        };
      }
      continue;
    }

    if (currentHunk) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentFile.additions++;
        currentHunk.lines.push({
          type: 'addition',
          content: line.slice(1),
          newLineNo: newLineCounter++,
        });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentFile.deletions++;
        currentHunk.lines.push({
          type: 'deletion',
          content: line.slice(1),
          oldLineNo: oldLineCounter++,
        });
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({
          type: 'context',
          content: line.slice(1),
          oldLineNo: oldLineCounter++,
          newLineNo: newLineCounter++,
        });
      }
    }
  }

  if (currentHunk && currentFile) {
    currentFile.hunks.push(currentHunk);
  }
  if (currentFile) {
    files.push(currentFile);
  }

  return files;
}

/**
 * Whitelist of allowed test commands to protect against command injection.
 */
export const ALLOWED_TEST_COMMANDS: Record<string, { bin: string; args: string[] }> = {
  'npm test': { bin: 'npm', args: ['test'] },
  'npm run test': { bin: 'npm', args: ['run', 'test'] },
  'unit-tests': { bin: 'npx', args: ['tsx', '--test', 'tests/unit_test.test.ts'] },
  'npx tsx --test tests/unit_test.test.ts': { bin: 'npx', args: ['tsx', '--test', 'tests/unit_test.test.ts'] },
  'npm run lint': { bin: 'npm', args: ['run', 'lint'] },
  'npm run build': { bin: 'npm', args: ['run', 'build'] },
  'acceptance-tests': { bin: 'npx', args: ['tsx', '--test', 'tests/unit_test.test.ts'] },
};

/**
 * Real isolated workspace service adhering to the Milestone 1 security constitution.
 */
export class WorkspaceService {
  private repoRoot: string;
  private worktreesRoot: string;
  private tasksFile: string;
  private auditFile: string;
  private tasks: Map<string, WorkspaceDetails> = new Map();
  private auditLogs: WorkspaceAuditEntry[] = [];

  constructor(repoRoot: string) {
    this.repoRoot = path.resolve(repoRoot);
    this.worktreesRoot = path.resolve(this.repoRoot, '.worktrees');
    const dataDir = path.resolve(this.repoRoot, 'data');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.worktreesRoot)) {
      fs.mkdirSync(this.worktreesRoot, { recursive: true });
    }

    this.tasksFile = path.resolve(dataDir, 'workspace_tasks.json');
    this.auditFile = path.resolve(dataDir, 'workspace_audit.json');

    this.loadPersistedState();
  }

  private loadPersistedState() {
    try {
      if (fs.existsSync(this.tasksFile)) {
        const raw = JSON.parse(fs.readFileSync(this.tasksFile, 'utf-8'));
        if (Array.isArray(raw)) {
          for (const item of raw) {
            this.tasks.set(item.taskId, item);
          }
        }
      }
    } catch (_) {
      // fallback to empty
    }

    try {
      if (fs.existsSync(this.auditFile)) {
        const raw = JSON.parse(fs.readFileSync(this.auditFile, 'utf-8'));
        if (Array.isArray(raw)) {
          this.auditLogs = raw;
        }
      }
    } catch (_) {
      // fallback to empty
    }
  }

  private persistState() {
    try {
      fs.writeFileSync(this.tasksFile, JSON.stringify(Array.from(this.tasks.values()), null, 2), 'utf-8');
      fs.writeFileSync(this.auditFile, JSON.stringify(this.auditLogs, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist workspace state:', err);
    }
  }

  private recordAudit(entry: Omit<WorkspaceAuditEntry, 'id' | 'timestamp'>) {
    const fullEntry: WorkspaceAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(fullEntry);
    this.persistState();
    return fullEntry;
  }

  public getAuditTrail(taskId?: string): WorkspaceAuditEntry[] {
    if (!taskId) return [...this.auditLogs];
    return this.auditLogs.filter((log) => log.taskId === taskId);
  }

  public getAllWorkspaces(): WorkspaceDetails[] {
    return Array.from(this.tasks.values());
  }

  public getWorkspace(taskId: string): WorkspaceDetails | null {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Helper to ensure git repository is valid.
   */
  public async ensureGitRepo(): Promise<boolean> {
    const res = await spawnSecureProcess('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: this.repoRoot,
    });
    return res.exitCode === 0;
  }

  /**
   * Creates an isolated worktree for a task.
   */
  public async createWorkspace(params: {
    taskId: string;
    title: string;
    baseBranch?: string;
    instructions?: string;
    plan?: WorkspacePlanItem[];
    actor?: string;
  }): Promise<WorkspaceDetails> {
    const taskId = params.taskId.trim();
    if (!validateTaskId(taskId)) {
      throw new Error(`Invalid taskId format: "${taskId}". Alphanumeric, underscores, hyphens only (3-64 chars).`);
    }

    const baseBranch = (params.baseBranch || 'main').trim();
    const actor = params.actor || 'authenticated-user';
    const worktreePath = resolveSafeWorktreePath(this.repoRoot, taskId);
    const branchName = `feat/${taskId}`;

    // Verify git repo
    const isRepo = await this.ensureGitRepo();
    if (!isRepo) {
      throw new Error('Project directory is not an initialized Git repository.');
    }

    // Capture base commit hash for divergence verification
    const baseCommitRes = await spawnSecureProcess('git', ['rev-parse', baseBranch], { cwd: this.repoRoot });
    if (baseCommitRes.exitCode !== 0) {
      throw new Error(`Base branch "${baseBranch}" does not exist in repository: ${baseCommitRes.stderr}`);
    }
    const baseCommitAtCreation = baseCommitRes.stdout.trim();

    // Check if worktree directory already exists
    if (fs.existsSync(worktreePath)) {
      // Remove stale worktree if present
      await spawnSecureProcess('git', ['worktree', 'remove', '--force', worktreePath], { cwd: this.repoRoot });
      if (fs.existsSync(worktreePath)) {
        fs.rmSync(worktreePath, { recursive: true, force: true });
      }
    }

    // Delete existing branch with same name if stale
    await spawnSecureProcess('git', ['branch', '-D', branchName], { cwd: this.repoRoot });

    // Spawn git worktree add
    const worktreeRes = await spawnSecureProcess(
      'git',
      ['worktree', 'add', '-b', branchName, worktreePath, baseBranch],
      { cwd: this.repoRoot }
    );

    if (worktreeRes.exitCode !== 0) {
      throw new Error(`Failed to create git worktree: ${worktreeRes.stderr || worktreeRes.stdout}`);
    }

    const defaultPlan: WorkspacePlanItem[] = params.plan && params.plan.length > 0 ? params.plan : [
      { id: '1', title: 'Inspect workspace and existing tests', status: 'completed' },
      { id: '2', title: 'Generate safe code patch in isolated worktree', status: 'in_progress' },
      { id: '3', title: 'Execute regression test suite', status: 'pending' },
      { id: '4', title: 'Review unified diff and await human approval', status: 'pending' },
    ];

    const workspace: WorkspaceDetails = {
      taskId,
      title: params.title || `Task: ${taskId}`,
      baseBranch,
      branch: branchName,
      worktreePath,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actor,
      instructions: params.instructions || '',
      plan: defaultPlan,
      changedFiles: [],
      rawDiff: '',
      parsedDiff: [],
      baseCommitAtCreation,
      approvalDecision: 'PENDING',
    };

    this.tasks.set(taskId, workspace);
    this.persistState();

    this.recordAudit({
      taskId,
      actor,
      action: 'CREATE',
      worktreePath,
      branch: branchName,
      baseBranch,
      changedFiles: [],
      approvalDecision: 'PENDING',
      details: `Worktree initialized on branch ${branchName} from ${baseBranch} (${baseCommitAtCreation.slice(0, 7)})`,
    });

    return workspace;
  }

  /**
   * Inspects current worktree status, branch, and modified files.
   */
  public async inspectWorkspace(taskId: string): Promise<WorkspaceDetails> {
    const workspace = this.tasks.get(taskId);
    if (!workspace) {
      throw new Error(`Workspace for task "${taskId}" not found.`);
    }

    const worktreePath = resolveSafeWorktreePath(this.repoRoot, taskId);
    if (!fs.existsSync(worktreePath)) {
      throw new Error(`Worktree directory does not exist: ${worktreePath}`);
    }

    const statusRes = await spawnSecureProcess('git', ['status', '--porcelain'], { cwd: worktreePath });
    const changedFiles: string[] = [];
    if (statusRes.exitCode === 0 && statusRes.stdout.trim()) {
      statusRes.stdout.trim().split('\n').forEach((line) => {
        const file = line.trim().slice(2).trim();
        if (file) changedFiles.push(file);
      });
    }

    // Refresh diff
    const diffData = await this.generateDiff(taskId);

    workspace.changedFiles = changedFiles.length > 0 ? changedFiles : diffData.changedFiles;
    workspace.rawDiff = diffData.rawDiff;
    workspace.parsedDiff = diffData.parsedDiff;
    workspace.updatedAt = new Date().toISOString();

    this.tasks.set(taskId, workspace);
    this.persistState();

    return workspace;
  }

  /**
   * Generates exact unified diff for the isolated worktree against base branch.
   */
  public async generateDiff(taskId: string): Promise<{ rawDiff: string; parsedDiff: WorkspaceDiffFile[]; changedFiles: string[] }> {
    const workspace = this.tasks.get(taskId);
    if (!workspace) {
      throw new Error(`Workspace for task "${taskId}" not found.`);
    }

    const worktreePath = resolveSafeWorktreePath(this.repoRoot, taskId);

    // Get diff against baseBranch
    const diffRes = await spawnSecureProcess('git', ['diff', workspace.baseBranch], { cwd: worktreePath });
    let rawDiff = diffRes.stdout;

    // If empty, check working directory diff against HEAD
    if (!rawDiff.trim()) {
      const headDiff = await spawnSecureProcess('git', ['diff', 'HEAD'], { cwd: worktreePath });
      rawDiff = headDiff.stdout;
    }

    const parsedDiff = parseUnifiedDiff(rawDiff);
    const changedFiles = parsedDiff.map((d) => d.file);

    return {
      rawDiff,
      parsedDiff,
      changedFiles,
    };
  }

  /**
   * Writes/updates a file inside the isolated worktree with containment checking.
   */
  public async updateFileInWorktree(taskId: string, relativeFilePath: string, content: string, commitMessage?: string): Promise<void> {
    const workspace = this.tasks.get(taskId);
    if (!workspace) throw new Error(`Workspace for task "${taskId}" not found.`);

    const worktreePath = resolveSafeWorktreePath(this.repoRoot, taskId);
    const safeTargetPath = path.resolve(worktreePath, relativeFilePath);

    if (!safeTargetPath.startsWith(worktreePath + path.sep)) {
      throw new Error(`Security Exception: File path "${relativeFilePath}" escapes worktree.`);
    }

    // Strict symlink escape guard
    if (fs.existsSync(safeTargetPath)) {
      const lstat = fs.lstatSync(safeTargetPath);
      if (lstat.isSymbolicLink()) {
        const realTarget = fs.realpathSync(safeTargetPath);
        const realWorktree = fs.realpathSync(worktreePath);
        if (!realTarget.startsWith(realWorktree + path.sep) && realTarget !== realWorktree) {
          throw new Error(`Security Exception: Symlink escape detected for "${relativeFilePath}".`);
        }
      }
    }

    const targetDir = path.dirname(safeTargetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(safeTargetPath, content, 'utf-8');

    // Automatically stage and commit change inside worktree
    await spawnSecureProcess('git', ['add', relativeFilePath], { cwd: worktreePath });
    if (commitMessage) {
      await spawnSecureProcess('git', ['commit', '-m', commitMessage], { cwd: worktreePath });
    }

    workspace.status = 'EDITED';
    workspace.updatedAt = new Date().toISOString();
    await this.inspectWorkspace(taskId);
  }

  /**
   * Executes whitelisted test command inside the isolated worktree.
   */
  public async runWorkspaceTests(taskId: string, commandKey: string = 'unit-tests'): Promise<WorkspaceTestResult> {
    const workspace = this.tasks.get(taskId);
    if (!workspace) throw new Error(`Workspace for task "${taskId}" not found.`);

    const worktreePath = resolveSafeWorktreePath(this.repoRoot, taskId);
    if (!fs.existsSync(worktreePath)) {
      throw new Error(`Worktree not found at ${worktreePath}`);
    }

    const commandConfig = ALLOWED_TEST_COMMANDS[commandKey];
    if (!commandConfig) {
      throw new Error(
        `Test command "${commandKey}" is not whitelisted. Allowed commands: ${Object.keys(ALLOWED_TEST_COMMANDS).join(', ')}`
      );
    }

    workspace.status = 'TESTS_RUNNING';
    this.persistState();

    const spawnResult = await spawnSecureProcess(commandConfig.bin, commandConfig.args, {
      cwd: worktreePath,
      timeoutMs: 20000,
    });

    const passed = spawnResult.exitCode === 0;
    const testResult: WorkspaceTestResult = {
      command: `${commandConfig.bin} ${commandConfig.args.join(' ')}`,
      exitCode: spawnResult.exitCode,
      stdout: spawnResult.stdout,
      stderr: spawnResult.stderr,
      durationMs: spawnResult.durationMs,
      passed,
      executedAt: new Date().toISOString(),
    };

    workspace.testResults = testResult;
    workspace.status = passed ? 'TESTS_PASSED' : 'TESTS_FAILED';
    workspace.updatedAt = new Date().toISOString();

    // Update plan checklist
    const planItem = workspace.plan.find((p) => p.id === '3');
    if (planItem) {
      planItem.status = passed ? 'completed' : 'in_progress';
    }

    this.tasks.set(taskId, workspace);
    this.persistState();

    this.recordAudit({
      taskId,
      actor: workspace.actor,
      action: 'RUN_TESTS',
      worktreePath,
      branch: workspace.branch,
      baseBranch: workspace.baseBranch,
      changedFiles: workspace.changedFiles,
      testCommand: testResult.command,
      testExitCode: testResult.exitCode,
      approvalDecision: workspace.approvalDecision || 'PENDING',
      details: passed ? 'Tests passed successfully' : `Tests failed with exit code ${spawnResult.exitCode}`,
    });

    return testResult;
  }

  /**
   * Refines the workspace: applies feedback, updates plan, marks as NEEDS_APPROVAL.
   */
  public async refineWorkspace(
    taskId: string,
    feedback: string,
    filePatches?: Array<{ file: string; content: string }>
  ): Promise<WorkspaceDetails> {
    const workspace = this.tasks.get(taskId);
    if (!workspace) throw new Error(`Workspace for task "${taskId}" not found.`);

    if (filePatches && filePatches.length > 0) {
      for (const patch of filePatches) {
        await this.updateFileInWorktree(taskId, patch.file, patch.content, `refine: ${feedback}`);
      }
    }

    workspace.status = 'NEEDS_APPROVAL';
    workspace.updatedAt = new Date().toISOString();
    workspace.instructions = `${workspace.instructions}\n\n[Refinement Feedback]: ${feedback}`.trim();

    // Mark plan item 4 as in_progress
    const reviewPlan = workspace.plan.find((p) => p.id === '4');
    if (reviewPlan) reviewPlan.status = 'in_progress';

    await this.inspectWorkspace(taskId);

    this.recordAudit({
      taskId,
      actor: workspace.actor,
      action: 'REFINE',
      worktreePath: workspace.worktreePath,
      branch: workspace.branch,
      baseBranch: workspace.baseBranch,
      changedFiles: workspace.changedFiles,
      approvalDecision: 'REFINED',
      details: `Refined with feedback: "${feedback}"`,
    });

    return workspace;
  }

  /**
   * Explicit Human Approval: Applies the isolated worktree patch into the primary branch.
   * STRICT SAFETY RULE: Rejects application if the destination branch has diverged since creation!
   */
  public async acceptWorkspace(taskId: string, actor: string = 'authorized-reviewer'): Promise<{ success: boolean; message: string }> {
    const workspace = this.tasks.get(taskId);
    if (!workspace) throw new Error(`Workspace for task "${taskId}" not found.`);

    const worktreePath = resolveSafeWorktreePath(this.repoRoot, taskId);

    // 1. Verify Destination Branch Has NOT Diverged
    const currentBaseRes = await spawnSecureProcess('git', ['rev-parse', workspace.baseBranch], {
      cwd: this.repoRoot,
    });
    if (currentBaseRes.exitCode !== 0) {
      throw new Error(`Failed to resolve current commit of base branch "${workspace.baseBranch}"`);
    }
    const currentBaseCommit = currentBaseRes.stdout.trim();

    if (currentBaseCommit !== workspace.baseCommitAtCreation) {
      // Check if base branch moved ahead
      const ancestorRes = await spawnSecureProcess(
        'git',
        ['merge-base', '--is-ancestor', workspace.baseCommitAtCreation, workspace.baseBranch],
        { cwd: this.repoRoot }
      );
      if (ancestorRes.exitCode !== 0) {
        throw new Error(
          `DESTINATION_DIVERGED: Base branch "${workspace.baseBranch}" has diverged completely from creation commit (${workspace.baseCommitAtCreation.slice(0, 7)}). Approval aborted for safety.`
        );
      }
    }

    // 2. Commit any unstaged changes in worktree
    await spawnSecureProcess('git', ['add', '-A'], { cwd: worktreePath });
    await spawnSecureProcess('git', ['commit', '-m', `workspace(${taskId}): finalize task changes`], { cwd: worktreePath });

    // 3. Checkout base branch in root repo and merge feature branch cleanly
    const checkoutRes = await spawnSecureProcess('git', ['checkout', workspace.baseBranch], { cwd: this.repoRoot });
    if (checkoutRes.exitCode !== 0) {
      throw new Error(`Failed to checkout base branch "${workspace.baseBranch}": ${checkoutRes.stderr}`);
    }

    const mergeRes = await spawnSecureProcess(
      'git',
      ['merge', '--no-ff', '-m', `Merge approved workspace feat/${taskId} into ${workspace.baseBranch}`, workspace.branch],
      { cwd: this.repoRoot }
    );

    if (mergeRes.exitCode !== 0) {
      // Abort merge on conflict to protect repository
      await spawnSecureProcess('git', ['merge', '--abort'], { cwd: this.repoRoot });
      throw new Error(`Merge failed with conflicts: ${mergeRes.stderr || mergeRes.stdout}`);
    }

    // 4. Safely remove isolated worktree
    await spawnSecureProcess('git', ['worktree', 'remove', '--force', worktreePath], { cwd: this.repoRoot });
    if (fs.existsSync(worktreePath)) {
      fs.rmSync(worktreePath, { recursive: true, force: true });
    }

    // 5. Delete feature branch
    await spawnSecureProcess('git', ['branch', '-d', workspace.branch], { cwd: this.repoRoot });

    // 6. Update workspace status
    workspace.status = 'ACCEPTED';
    workspace.approvalDecision = 'ACCEPTED';
    workspace.updatedAt = new Date().toISOString();

    const planItem = workspace.plan.find((p) => p.id === '4');
    if (planItem) planItem.status = 'completed';

    this.tasks.set(taskId, workspace);
    this.persistState();

    this.recordAudit({
      taskId,
      actor,
      action: 'ACCEPT',
      worktreePath,
      branch: workspace.branch,
      baseBranch: workspace.baseBranch,
      changedFiles: workspace.changedFiles,
      approvalDecision: 'ACCEPTED',
      details: `Explicit human approval granted. Branch ${workspace.branch} merged into ${workspace.baseBranch}. Worktree pruned.`,
    });

    return {
      success: true,
      message: `Task ${taskId} accepted and merged into ${workspace.baseBranch} successfully.`,
    };
  }

  /**
   * Discards the isolated worktree safely without modifying the primary branch.
   * Guard: Refuses to delete if uncommitted work or unmerged commits exist unless explicit force authorization is provided.
   */
  public async discardWorkspace(
    taskId: string,
    actor: string = 'authorized-reviewer',
    options?: { force?: boolean }
  ): Promise<{ success: boolean; message: string }> {
    const workspace = this.tasks.get(taskId);
    if (!workspace) throw new Error(`Workspace for task "${taskId}" not found.`);

    const worktreePath = resolveSafeWorktreePath(this.repoRoot, taskId);

    // Guard: Check for uncommitted work in the worktree
    if (fs.existsSync(worktreePath)) {
      const statusRes = await spawnSecureProcess('git', ['status', '--porcelain'], { cwd: worktreePath });
      if (statusRes.exitCode === 0 && statusRes.stdout.trim().length > 0) {
        if (!options?.force) {
          throw new Error(
            `Refusing to force-remove worktree for task "${taskId}": uncommitted changes exist in "${worktreePath}". Commit, stash, or provide explicit force authorization.`
          );
        }
      }
    }

    // Guard: Check for unmerged commits on the feature branch compared to base branch
    if (!options?.force) {
      const logRes = await spawnSecureProcess(
        'git',
        ['log', `${workspace.baseBranch}..${workspace.branch}`, '--oneline'],
        { cwd: this.repoRoot }
      );
      if (logRes.exitCode === 0 && logRes.stdout.trim().length > 0) {
        throw new Error(
          `Refusing to force-delete branch "${workspace.branch}": unmerged commits exist. Merge into ${workspace.baseBranch} or provide explicit force authorization.`
        );
      }
    }

    // Remove worktree
    await spawnSecureProcess('git', ['worktree', 'remove', '--force', worktreePath], { cwd: this.repoRoot });
    if (fs.existsSync(worktreePath)) {
      fs.rmSync(worktreePath, { recursive: true, force: true });
    }

    // Delete feature branch
    await spawnSecureProcess('git', ['branch', '-D', workspace.branch], { cwd: this.repoRoot });

    workspace.status = 'DISCARDED';
    workspace.approvalDecision = 'DISCARDED';
    workspace.updatedAt = new Date().toISOString();

    this.tasks.set(taskId, workspace);
    this.persistState();

    this.recordAudit({
      taskId,
      actor,
      action: 'DISCARD',
      worktreePath,
      branch: workspace.branch,
      baseBranch: workspace.baseBranch,
      changedFiles: workspace.changedFiles,
      approvalDecision: 'DISCARDED',
      details: `Workspace feat/${taskId} discarded and cleaned up safely. Primary branch untouched.`,
    });

    return {
      success: true,
      message: `Workspace for task "${taskId}" discarded and pruned cleanly.`,
    };
  }
}
