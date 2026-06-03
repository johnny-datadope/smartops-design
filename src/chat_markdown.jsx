// Mirrors chia server-message-templates.ts + Ceres _build_analysis_message_content
// Commands executed: inline markdown like Apolo chat-messages.ts (ReactMarkdown / prose)

const PLACEHOLDER = /\{\{([a-z0-9_]+)\}\}/gi;

function getTemplateMap(t) {
  return {
    root_cause_analysis: t.rca.sectionHeadingRootCause,
    evidence: t.rca.sectionHeadingEvidence,
    proposed_solution: t.rca.sectionHeadingProposedSolution,
  };
}

function applyServerMessageTemplates(text, t) {
  if (!text) return '';
  const map = getTemplateMap(t);
  return text.replace(PLACEHOLDER, (full, key) => {
    const k = String(key).toLowerCase();
    return map[k] ?? full;
  });
}

/** Apolo: label + one pre block per command (prose-invert pre styling). */
function appendCommandsExecutedMarkdown(markdown, commands, t) {
  if (!Array.isArray(commands) || commands.length === 0) return markdown;
  const label = (t.mockInvestigation?.commandsExecuted || '⚙️ Commands executed:')
    .replace(/\*\*/g, '')
    .trim();
  const blocks = commands
    .map((cmd) => `\n\n\`\`\`\n${String(cmd).trim()}\n\`\`\``)
    .join('');
  const base = String(markdown || '').trim();
  return base ? `${base}\n\n**${label}**${blocks}` : `**${label}**${blocks}`;
}

/** Build Apolo/Ceres markdown for TRIAGE_RCA agent bubble. */
function buildChatAnalysisMarkdown(turn, t) {
  let md;
  if (turn.markdown) {
    md = applyServerMessageTemplates(turn.markdown, t);
  } else {
    const sections = [];
    if (turn.rca?.title) {
      sections.push(`### {{root_cause_analysis}}\n**${turn.rca.title.trim()}**`);
    }
    if (turn.rca?.bodyText) {
      sections.push(turn.rca.bodyText.trim());
    }
    if (turn.rca_why?.trim()) {
      sections.push(turn.rca_why.trim());
    }
    if (turn.evidenceText) {
      sections.push(`### {{evidence}}\n${turn.evidenceText.trim()}`);
    }
    if (turn.solutionMarkdown) {
      sections.push(`### {{proposed_solution}}\n${turn.solutionMarkdown.trim()}`);
    } else if (Array.isArray(turn.solutionLines) && turn.solutionLines.length) {
      const bullets = turn.solutionLines.map(line => `- ${line}`).join('\n');
      sections.push(`### {{proposed_solution}}\n${bullets}`);
    }
    md = applyServerMessageTemplates(sections.join('\n\n'), t);
  }
  return appendCommandsExecutedMarkdown(md, turn.commands, t);
}

function fallbackMarkdownToHtml(markdown) {
  return String(markdown)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '<p>')
    .replace(/(?<![>])\n(?!<)/g, '<br/>');
}

function parseChatMarkdown(markdown) {
  const text = String(markdown || '').trim();
  if (!text) return '';
  if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
    try {
      const result = marked.parse(text, { breaks: true, gfm: true, async: false });
      if (typeof result === 'string' && result.trim()) return result;
    } catch (_) { /* fall through */ }
  }
  return fallbackMarkdownToHtml(text);
}

function ChatMarkdownBubble({ turn, t }) {
  const markdown = React.useMemo(
    () => buildChatAnalysisMarkdown(turn, t),
    [turn.markdown, turn.rca, turn.evidenceText, turn.solutionMarkdown, turn.solutionLines, turn.rca_why, turn.commands, t],
  );
  const html = React.useMemo(() => parseChatMarkdown(markdown), [markdown]);

  if (!markdown.trim()) return null;

  return (
    <div className="chat-msg__bubble chat-msg__bubble--agent">
      <div
        className="chat-prose chat-prose--agent"
        dangerouslySetInnerHTML={{ __html: html || fallbackMarkdownToHtml(markdown) }}
      />
    </div>
  );
}

Object.assign(window, {
  applyServerMessageTemplates,
  buildChatAnalysisMarkdown,
  appendCommandsExecutedMarkdown,
  parseChatMarkdown,
  ChatMarkdownBubble,
});
