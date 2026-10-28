import path from 'path';

// Safe Arithmetic Tool (Zero eval AST)
export function extractArithmetic(text: string): string | null {
  const patterns = [
    /(?:тооцоол|бод|calculate|compute|what is)\s*[:：]?\s*([0-9][0-9\s().+\-*/%^]+)/i,
    /^\s*([0-9][0-9\s().+\-*/%^]+)\s*(?:тооцоол|бод|calculate|compute)?\s*[?.!]*\s*$/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const expr = match[1].replace(/\s+/g, '');
      if (/[+\-*/%^]/.test(expr) && /^[0-9().+\-*/%^]+$/.test(expr)) {
        return expr;
      }
    }
  }
  return null;
}

export function safeCalculate(expr: string): number {
  const cleaned = expr.replace(/\s+/g, '');
  if (!cleaned) throw new Error('Empty expression');
  if (cleaned.length > 300) throw new Error('Expression too long');
  if (!/^[0-9().+\-*/%^]+$/.test(cleaned)) {
    throw new Error('Only basic arithmetic characters are allowed.');
  }

  let index = 0;
  function peek(): string { return cleaned[index] || ''; }
  function get(): string { return cleaned[index++] || ''; }

  function parseNumber(): number {
    let numStr = '';
    while (index < cleaned.length && /[0-9.]/.test(cleaned[index])) {
      numStr += get();
    }
    const val = parseFloat(numStr);
    if (isNaN(val)) throw new Error('Invalid number');
    if (Math.abs(val) > 1e12) throw new Error('Number too large');
    return val;
  }

  function parseFactor(): number {
    if (peek() === '+') { get(); return parseFactor(); }
    if (peek() === '-') { get(); return -parseFactor(); }
    if (peek() === '(') {
      get();
      const val = parseExpression();
      if (get() !== ')') throw new Error("Missing ')'");
      return val;
    }
    return parseNumber();
  }

  function parsePower(): number {
    let left = parseFactor();
    while (peek() === '^') {
      get();
      const right = parsePower();
      if (Math.abs(right) > 8) throw new Error('Exponent too large.');
      left = Math.pow(left, right);
    }
    return left;
  }

  function parseTerm(): number {
    let left = parsePower();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = get();
      const right = parsePower();
      if (op === '*') left = left * right;
      else if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        left = left / right;
      } else if (op === '%') {
        if (right === 0) throw new Error('Modulo by zero');
        left = left % right;
      }
    }
    return left;
  }

  function parseExpression(): number {
    let left = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = get();
      const right = parseTerm();
      if (op === '+') left = left + right;
      else if (op === '-') left = left - right;
    }
    return left;
  }

  const result = parseExpression();
  if (index < cleaned.length) {
    throw new Error('Unexpected character at index ' + index);
  }
  if (!Number.isFinite(result) || Math.abs(result) > 1e15) {
    throw new Error('Result out of allowed range');
  }
  return result;
}

// File Reading & Containment Tool
export function safeKnowledgePath(filename: string, knowledgeDir: string): string {
  const baseName = path.basename(filename);
  if (baseName !== filename || !['.txt', '.md'].includes(path.extname(filename).toLowerCase())) {
    throw new Error('Only .txt/.md files directly inside the knowledge folder are allowed.');
  }
  const resolved = path.resolve(knowledgeDir, baseName);
  if (!resolved.startsWith(knowledgeDir)) {
    throw new Error('Path outside knowledge folder is not allowed.');
  }
  return resolved;
}

// Language Detection
export function detectLanguage(text: string): 'mn' | 'en' | 'ja' {
  if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return 'ja';
  return /[А-Яа-яЁёӨөҮү]/.test(text) ? 'mn' : 'en';
}

// Memory Search Scoring
export interface MemoryItem {
  id: string;
  userId: string;
  category: string;
  title: string;
  content: string;
  importance: 'high' | 'medium' | 'low';
  tags: string[];
  connections?: string[];
}

export function rankMemories(memories: MemoryItem[], query: string, maxResults: number = 4): MemoryItem[] {
  const qTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (qTerms.length === 0) {
    return memories.slice(0, maxResults);
  }

  const scored = memories.map((mem) => {
    let score = 0;
    const titleL = mem.title.toLowerCase();
    const contentL = mem.content.toLowerCase();
    const catL = mem.category.toLowerCase();
    const tagsL = (mem.tags || []).map((t) => t.toLowerCase());

    for (const term of qTerms) {
      if (titleL.includes(term)) score += 5;
      if (contentL.includes(term)) score += 2;
      if (catL.includes(term)) score += 3;
      if (tagsL.some((t) => t.includes(term))) score += 4;
    }

    if (mem.importance === 'high') score += 2;
    return { ...mem, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((m) => m.score > 0).slice(0, maxResults);
}
