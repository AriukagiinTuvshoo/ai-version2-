export type LanguageMode = 'auto' | 'mn' | 'en' | 'ja';
export type ViewTab = 'home' | 'chat' | 'projects' | 'agents' | 'memory' | 'workspace' | 'activity' | 'settings' | 'diagnostics' | 'graph';

export interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'user';
  email: string;
  avatarColor: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'verified' | 'failed';
  agent: string;
  progress: number;
  createdAt?: string;
}

export interface ProjectDecision {
  id: string;
  date: string;
  title: string;
  rationale: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  tagline: string;
  status: 'active' | 'archived' | 'completed';
  path: string;
  description: string;
  createdAt: string;
  tasks: ProjectTask[];
  decisions: ProjectDecision[];
}

export interface MemoryItem {
  id: string;
  userId: string;
  category: 'preference' | 'goal' | 'technical_decision' | 'knowledge_note' | 'error_solution';
  title: string;
  content: string;
  importance: 'high' | 'medium' | 'low';
  tags: string[];
  connections: string[];
  updatedAt: string;
}

export interface GalaxyNode {
  id: string;
  label: string;
  category: string;
  importance: string;
  tags: string[];
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  updatedAt: string;
  snippet: string;
}

export interface GalaxyLink {
  source: string;
  target: string;
  strength: number;
}

export interface GalaxyGraphData {
  galaxyName: string;
  totalStars: number;
  totalLinks: number;
  nodes: GalaxyNode[];
  backgroundStars: { id: string; x: number; y: number; z: number; size: number; brightness: number }[];
  links: GalaxyLink[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  model: string;
  status: 'idle' | 'working' | 'active' | 'reviewing';
  color: string;
  icon: string;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  target: string;
  status: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  details: string;
  diff?: string;
}

export interface AgentResponse {
  answer: string;
  model: string;
  status: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  language: 'mn' | 'en' | 'ja';
  is_arithmetic?: boolean;
  expression?: string;
  result?: number;
  grounded_file?: string | null;
}

export interface ConversationTurn {
  id: string;
  timestamp: string;
  userText: string;
  response: AgentResponse;
  savedToReport?: boolean;
  savedToMemory?: boolean;
}

export interface KnowledgeFile {
  name: string;
  size: number;
  updated_at: string;
  content: string;
}

export interface SystemSettings {
  primaryModel: string;
  fallbackModel: string;
  offlineMode: boolean;
  autoReview: boolean;
  maxFileBytes: number;
  monthlyBudgetUSD: number;
  spentBudgetUSD: number;
  voiceEnabled: boolean;
  voiceLanguage: string;
  strictVerification: boolean;
}

export interface V4MemoryItem {
  id: number;
  created_at: string;
  language: string;
  user_text: string;
  assistant_text: string;
}

export interface KVMemoryItem {
  key: string;
  value: string;
  updated_at: string;
}

export interface ReportItem {
  filename: string;
  content: string;
  created_at: string;
}

export interface DiagnosticData {
  system: string;
  active_user: string;
  api_key_configured: boolean;
  primary_model: string;
  knowledge_dir_exists: boolean;
  knowledge_files_count: number;
  reports_count: number;
  projects_count: number;
  memories_count: number;
  v4_memory_count?: number;
  kv_memory_count?: number;
  calculator_self_test: boolean;
  offline_mode: boolean;
  server_time: string;
}

export interface AcceptanceTestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export interface AcceptanceTestSuiteResponse {
  total: number;
  passed: number;
  results: AcceptanceTestResult[];
}

export interface WorkspacePlanItem {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface WorkspaceTestResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  passed: boolean;
  executedAt: string;
}

export interface WorkspaceDiffHunkLine {
  type: 'context' | 'addition' | 'deletion';
  content: string;
  oldLineNo?: number;
  newLineNo?: number;
}

export interface WorkspaceDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: WorkspaceDiffHunkLine[];
}

export interface WorkspaceDiffFile {
  file: string;
  oldPath?: string;
  newPath?: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  hunks: WorkspaceDiffHunk[];
}

export interface WorkspaceDetails {
  taskId: string;
  title: string;
  baseBranch: string;
  branch: string;
  worktreePath: string;
  status: 'CREATED' | 'EDITED' | 'TESTS_RUNNING' | 'TESTS_PASSED' | 'TESTS_FAILED' | 'NEEDS_APPROVAL' | 'ACCEPTED' | 'DISCARDED';
  createdAt: string;
  updatedAt: string;
  actor: string;
  instructions?: string;
  plan: WorkspacePlanItem[];
  changedFiles: string[];
  rawDiff: string;
  parsedDiff: WorkspaceDiffFile[];
  testResults?: WorkspaceTestResult;
  approvalDecision?: 'PENDING' | 'ACCEPTED' | 'REFINED' | 'DISCARDED';
  baseCommitAtCreation: string;
}

export interface WorkspaceAuditEntry {
  id: string;
  taskId: string;
  actor: string;
  timestamp: string;
  action: 'CREATE' | 'INSPECT' | 'APPLY_PATCH' | 'RUN_TESTS' | 'REFINE' | 'ACCEPT' | 'DISCARD';
  worktreePath: string;
  branch: string;
  baseBranch: string;
  changedFiles: string[];
  testCommand?: string;
  testExitCode?: number;
  approvalDecision: 'PENDING' | 'ACCEPTED' | 'REFINED' | 'DISCARDED';
  details?: string;
}

// Executive Dashboard Types (Reference image_ac866cb8.png)
export interface DashboardEmailItem {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  time: string;
  unread: boolean;
  priority: 'high' | 'normal' | 'low';
  summarySnippet: string;
}

export interface DashboardCalendarEvent {
  id: string;
  time: string;
  endTime: string;
  title: string;
  category: 'planning' | 'architecture' | 'review' | 'pairing';
  color: string;
}

export interface DashboardAutomation {
  id: string;
  title: string;
  schedule: string;
  status: 'active' | 'paused';
  icon: string;
  lastRun?: string;
  nextRun?: string;
}

export interface DashboardFocusItem {
  id: string;
  title: string;
  completed: boolean;
  category: string;
}

export interface DashboardOverviewData {
  greeting: string;
  subtitle: string;
  focusScore: number;
  unreadEmailCount: number;
  emailAiSummary: string;
  emails: DashboardEmailItem[];
  calendarEvents: DashboardCalendarEvent[];
  researchBrief: {
    title: string;
    date: string;
    summary: string;
    bullets: string[];
  };
  automations: DashboardAutomation[];
  focusItems: DashboardFocusItem[];
}

// Knowledge Graph & Communities Types (Reference image_4d64129a.png)
export interface KnowledgeGraphNode {
  id: string;
  label: string;
  category: string;
  communityId: number;
  communityColor: string;
  pageRank: number;
  degree: number;
  depth: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  strength: number;
}

export interface KnowledgeGraphCommunity {
  id: number;
  name: string;
  color: string;
  nodeCount: number;
  summary: string;
}

