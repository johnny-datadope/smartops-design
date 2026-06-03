// Mirrors chia server-message-templates.ts + Ceres _build_analysis_message_content

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

/** Build Apolo/Ceres markdown for TRIAGE_RCA agent bubble. */
function buildAnalysisMarkdown(turn, t) {
  if (turn.markdown) {
    return applyServerMessageTemplates(turn.markdown, t);
  }

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
  if (turn.commands?.length) {
    const cmds = turn.commands.map(c => `\`${c}\``).join(', ');
    sections.push(`**⚙️ Commands executed:** ${cmds}`);
  }

  return applyServerMessageTemplates(sections.join('\n\n'), t);
}

function parseChatMarkdown(markdown) {
  if (!markdown) return '';
  if (typeof marked !== 'undefined') {
    return marked.parse(markdown, { breaks: true, gfm: true });
  }
  return markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

function ChatMarkdownBubble({ turn, t }) {
  const html = React.useMemo(() => {
    const md = buildAnalysisMarkdown(turn, t);
    return parseChatMarkdown(md);
  }, [turn, t]);

  if (!html) return null;

  return (
    <div className="chat-msg__bubble chat-msg__bubble--agent">
      <div
        className="chat-prose chat-prose--agent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

Object.assign(window, {
  applyServerMessageTemplates,
  buildAnalysisMarkdown,
  parseChatMarkdown,
  ChatMarkdownBubble,
});
