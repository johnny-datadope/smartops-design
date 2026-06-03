// Terminal query syntax highlighting — mirrors Apolo reasoning-display.tsx (renderTerminalQuery).

function normalizeTerminalOutput(s) {
  return String(s || '')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r');
}

const TERMINAL_TOKEN_SPLIT_REGEX = /(\s+|[{}[\](),:])/g;
const NUMBER_TOKEN_REGEX = /^\d+(\.\d+)?$/;
const QUOTED_TOKEN_REGEX = /^["'`].*["'`]$/;

const PYTHON_KEYWORDS = new Set([
  'import', 'from', 'def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while',
  'in', 'print', 'True', 'False', 'None', 'and', 'or', 'not', 'as', 'with', 'try',
  'except', 'finally', 'raise', 'pass', 'break', 'continue', 'lambda', 'yield',
  'async', 'await', 'del', 'global', 'nonlocal', 'assert', 'is',
]);

function renderTerminalToken(part, index, state) {
  if (!part) return null;
  if (/^\s+$/.test(part)) return part;

  if (part === ':') {
    state.afterColon = true;
    return (
      <span key={index} className="terminal-token terminal-token--punct">{part}</span>
    );
  }

  if (QUOTED_TOKEN_REGEX.test(part)) {
    const cls = state.afterColon ? 'terminal-token--string' : 'terminal-token--key';
    state.afterColon = false;
    return (
      <span key={index} className={`terminal-token ${cls}`}>{part}</span>
    );
  }

  if (PYTHON_KEYWORDS.has(part)) {
    state.afterColon = false;
    return (
      <span key={index} className="terminal-token terminal-token--keyword">{part}</span>
    );
  }

  if (part.includes('=') && !QUOTED_TOKEN_REGEX.test(part)) {
    const eqIdx = part.indexOf('=');
    const key = part.slice(0, eqIdx);
    const value = part.slice(eqIdx + 1);
    state.afterColon = false;
    return (
      <span key={index}>
        <span className="terminal-token terminal-token--assign-key">{key}</span>
        <span className="terminal-token terminal-token--punct">=</span>
        <span className={`terminal-token ${NUMBER_TOKEN_REGEX.test(value) ? 'terminal-token--number' : 'terminal-token--string'}`}>
          {value}
        </span>
      </span>
    );
  }

  if (/^--?[\w-]+/.test(part)) {
    state.afterColon = false;
    return (
      <span key={index} className="terminal-token terminal-token--flag">{part}</span>
    );
  }

  if (NUMBER_TOKEN_REGEX.test(part)) {
    state.afterColon = false;
    return (
      <span key={index} className="terminal-token terminal-token--number">{part}</span>
    );
  }

  if (/^[{}[\](),]$/.test(part)) {
    if (part === ',') state.afterColon = false;
    return (
      <span key={index} className="terminal-token terminal-token--punct">{part}</span>
    );
  }

  state.afterColon = false;
  return (
    <span key={index} className="terminal-token terminal-token--plain">{part}</span>
  );
}

function renderTerminalQueryLine(line, lineKey) {
  const parts = line.split(TERMINAL_TOKEN_SPLIT_REGEX);
  const state = { afterColon: false };
  return parts.map((part, index) => renderTerminalToken(part, `${lineKey}-${index}`, state));
}

function renderTerminalQuery(command) {
  const text = normalizeTerminalOutput(command);
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => (
    <React.Fragment key={`line-${lineIdx}`}>
      {lineIdx > 0 ? '\n' : null}
      {renderTerminalQueryLine(line, lineIdx)}
    </React.Fragment>
  ));
}

Object.assign(window, { normalizeTerminalOutput, renderTerminalQuery });
