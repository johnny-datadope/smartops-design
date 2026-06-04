// Mirrors chia server-message-templates.ts + Ceres _build_analysis_message_content
// Commands executed: inline markdown like Apolo chat-messages.ts (ReactMarkdown / prose)

const PLACEHOLDER = /\{\{([a-z0-9_]+)\}\}/gi;

function getTemplateMap(t) {
  const pm = t.postMortemMd || {};
  const st = t.irisAgentStep || {};
  return {
    root_cause_analysis: t.rca.sectionHeadingRootCause,
    evidence: t.rca.sectionHeadingEvidence,
    proposed_solution: t.rca.sectionHeadingProposedSolution,
    pm_section_executive_summary: pm.sectionExecutiveSummary,
    pm_section_incident_management: pm.sectionIncidentManagement,
    pm_section_impact_analysis: pm.sectionImpactAnalysis,
    pm_section_timeline: pm.sectionTimeline,
    pm_section_root_cause_analysis: pm.sectionRootCauseAnalysis,
    pm_section_action_points: pm.sectionActionPoints,
    pm_section_lessons_learned: pm.sectionLessonsLearned,
    pm_section_recommendations: pm.sectionRecommendations,
    pm_label_severity: pm.labelSeverity,
    pm_label_affected_systems: pm.labelAffectedSystems,
    pm_label_timings: pm.labelTimings,
    pm_label_start: pm.labelStart,
    pm_label_report_generated: pm.labelReportGenerated,
    pm_label_elapsed: pm.labelElapsed,
    pm_empty_timeline: pm.emptyTimeline,
    pm_empty_actions: pm.emptyActions,
    pm_empty_lessons: pm.emptyLessons,
    pm_empty_recommendations: pm.emptyRecommendations,
    pm_footer: pm.footer,
    pm_row_detection: pm.rowDetection,
    pm_row_escalation: pm.rowEscalation,
    pm_escalation_info: pm.escalationInfo,
    pm_table_check: pm.tableCheck,
    pm_table_result: pm.tableResult,
    pm_table_additional_information: pm.tableAdditionalInformation,
    iris_step_post_mortem: st.postMortem,
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

/** Build Apolo/Ceres markdown for TRIAGE_RCA or POST_MORTEM agent bubble. */
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

function ChatMarkdownBubble({ turn, t, className = '' }) {
  const markdown = React.useMemo(
    () => buildChatAnalysisMarkdown(turn, t),
    [turn.kind, turn.markdown, turn.rca, turn.evidenceText, turn.solutionMarkdown, turn.solutionLines, turn.rca_why, turn.commands, t],
  );
  const html = React.useMemo(() => parseChatMarkdown(markdown), [markdown]);

  if (!markdown.trim()) return null;

  return (
    <div className={'chat-msg__bubble chat-msg__bubble--agent' + (className ? ' ' + className : '')}>
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
