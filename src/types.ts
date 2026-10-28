export type LanguageMode = 'auto' | 'mn' | 'en' | 'ja';
export type ViewTab = 'home' | 'chat' | 'projects' | 'agents' | 'memory' | 'activity' | 'settings' | 'diagnostics';

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
