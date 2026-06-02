// Minimal line-icon set. 1.5px stroke, 18px default box.
const Icon = ({ d, size = 16, sw = 1.5, fill = 'none', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const IconPulse = (p) => <Icon {...p} d="M3 12h3l2-7 3 14 2-9 2 5 2-3h4" />;
const IconBell = (p) => <Icon {...p} d={<>
  <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/>
  <path d="M10 20a2 2 0 0 0 4 0"/>
</>} />;
const IconSettings = (p) => <Icon {...p} d={<>
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</>} />;
const IconSearch = (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />;
const IconFilter = (p) => <Icon {...p} d="M3 5h18l-7 9v6l-4-2v-4z" />;
const IconArchive = (p) => <Icon {...p} d={<>
  <path d="M3 5h18v4H3z"/>
  <path d="M5 9v10h14V9"/>
  <path d="M10 13h4"/>
</>} />;
const IconPlus = (p) => <Icon {...p} d={<><path d="M12 5v14"/><path d="M5 12h14"/></>} />;
const IconLogout = (p) => <Icon {...p} d={<>
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  <path d="M16 17l5-5-5-5"/>
  <path d="M21 12H9"/>
</>} />;
const IconHeadset = (p) => <Icon {...p} d={<>
  <path d="M3 14v-2a9 9 0 0 1 18 0v2"/>
  <path d="M21 14v3a2 2 0 0 1-2 2h-2v-7h2a2 2 0 0 1 2 2z"/>
  <path d="M3 14v3a2 2 0 0 0 2 2h2v-7H5a2 2 0 0 0-2 2z"/>
</>} />;
// Lucide ArrowUpDown / ArrowUp / ArrowDown — Chia SortableTableHead
const IconArrowUpDown = (p) => <Icon {...p} d={<>
  <path d="m21 16-4 4-4-4"/><path d="M17 20V4"/>
  <path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>
</>} />;
const IconArrowUp = (p) => <Icon {...p} d={<>
  <path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
</>} />;
const IconArrowDown = (p) => <Icon {...p} d={<>
  <path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>
</>} />;
const IconCheck = (p) => <Icon {...p} d="M5 12l5 5L20 7" />;
// Lucide CheckCircle2 — Chia KPI "Casos resueltos"
const IconCheckCircle2 = (p) => <Icon {...p} d={<>
  <circle cx="12" cy="12" r="10"/>
  <path d="m9 12 2 2 4-4"/>
</>} />;
const IconEye = (p) => <Icon {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />;
const IconEyeOff = (p) => <Icon {...p} d={<><path d="M10.733 5.076 10.2 5.65A7 7 0 0 0 5 12c0 .65.09 1.28.26 1.88l-.74.74"/><path d="M2 2l20 20"/><path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c4.48 0 8.24 3.04 10 7.5a9.17 9.17 0 0 1-1.56 2.38"/><path d="M6.61 6.61A9.12 9.12 0 0 0 2 12c1.76 4.46 5.52 7.5 10 7.5 1.05 0 2.05-.16 3-.45"/></>} />;
const IconAlert = (p) => <Icon {...p} d={<><path d="M10.3 3.86a2 2 0 0 1 3.4 0l8.2 14.14A2 2 0 0 1 20.2 21H3.8a2 2 0 0 1-1.7-3L10.3 3.86z"/><path d="M12 9v5"/><path d="M12 17.5v.01"/></>} />;
const IconTriangle = (p) => <Icon {...p} d={'M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z'} />;
const IconChevronDown = (p) => <Icon {...p} d={'m6 9 6 6 6-6'} />;
const IconHash = (p) => <Icon {...p} d={<><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="m16 3-2 18"/></>} />;
const IconShieldCheck = (p) => <Icon {...p} d={<>
  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
  <path d="m9 12 2 2 4-4"/>
</>} />;
const IconActivity = (p) => <Icon {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />;
const IconClose = (p) => <Icon {...p} d={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>} />;
const IconXCircle = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></>} />;
const IconChevron = (p) => <Icon {...p} d={'m9 18 6-6-6-6'} />;
const IconSparkle = (p) => <Icon {...p} d={<>
  <path d="M12 3v4"/><path d="M12 17v4"/>
  <path d="M3 12h4"/><path d="M17 12h4"/>
  <path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/>
  <path d="m5.6 18.4 2.8-2.8"/><path d="m15.6 8.4 2.8-2.8"/>
</>} />;
const IconCopy = (p) => <Icon {...p} d={<>
  <rect x="9" y="9" width="13" height="13" rx="2"/>
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
</>} />;
const IconLink = (p) => <Icon {...p} d={<>
  <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/>
  <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>
</>} />;
const IconMaximize = (p) => <Icon {...p} d={<>
  <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
  <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
</>} />;
// Lucide ExternalLink — Chia alert-detail header (open full page)
const IconExternalLink = (p) => <Icon {...p} d={<>
  <path d="M15 3h6v6"/>
  <path d="M10 14 21 3"/>
  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
</>} />;
// Lucide Minimize2 — Chia alert-detail header (exit full page)
const IconMinimize2 = (p) => <Icon {...p} d={<>
  <polyline points="4 14 10 14 10 20"/>
  <polyline points="20 10 14 10 14 4"/>
  <line x1="14" y1="10" x2="21" y2="3"/>
  <line x1="3" y1="21" x2="10" y2="14"/>
</>} />;
const IconMinimize = IconMinimize2;
const IconTerminal = (p) => <Icon {...p} d={<>
  <path d="m4 9 4 3-4 3"/><path d="M12 15h8"/>
  <rect x="2" y="4" width="20" height="16" rx="2"/>
</>} />;
const IconBriefcase = (p) => <Icon {...p} d={<><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect x="2" y="7" width="20" height="14" rx="2"/></>} />;
const IconMessageSquare = (p) => <Icon {...p} d={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>} />;
const IconDatabase = (p) => <Icon {...p} d={<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></>} />;
const IconClock = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>} />;
const IconCalendar = (p) => <Icon {...p} d={<>
  <path d="M8 2v4"/><path d="M16 2v4"/>
  <rect width="18" height="18" x="3" y="4" rx="2"/>
  <path d="M3 10h18"/>
</>} />;
const IconUsers = (p) => <Icon {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IconThumbsUp = (p) => <Icon {...p} d={<><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></>} />;
const IconThumbsDown = (p) => <Icon {...p} d={<><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></>} />;
const IconLifeBuoy = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></>} />;
const IconRotateCcw = (p) => <Icon {...p} d={<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></>} />;
const IconFileText = (p) => <Icon {...p} d={<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></>} />;
const IconShare = (p) => <Icon {...p} d={<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="M15.41 6.51l-6.82 3.98"/></>} />;
const IconUser = (p) => <Icon {...p} d={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
const IconUserX = (p) => <Icon {...p} d={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 8 5 5"/><path d="m22 8-5 5"/></>} />;
const IconSend = (p) => <Icon {...p} d={<><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></>} />;
const IconBrain = (p) => <Icon {...p} d={<><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></>} />;

// Lucide BrainCircuit — used in Chia alerts table "Analyze" column.
const IconBrainCircuit = (p) => <Icon {...p} d={<>
  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
  <path d="M9 13a4.5 4.5 0 0 0 3-4"/>
  <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
  <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
  <path d="M6 18a4 4 0 0 1-1.967-.516"/>
  <path d="M12 13h4"/>
  <path d="M12 18h6a2 2 0 0 1 2 2v1"/>
  <path d="M12 8h8"/>
  <path d="M16 8V5a2 2 0 0 1 2-2"/>
  <circle cx="16" cy="13" r=".5" fill="currentColor" stroke="none"/>
  <circle cx="18" cy="3" r=".5" fill="currentColor" stroke="none"/>
  <circle cx="20" cy="21" r=".5" fill="currentColor" stroke="none"/>
  <circle cx="20" cy="8" r=".5" fill="currentColor" stroke="none"/>
</>} />;

// Lucide PenLine — Chia case-comments-section header
const IconPenLine = (p) => <Icon {...p} d={<>
  <path d="M12 20h9"/>
  <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>
</>} />;

const IconMoreVertical = (p) => <Icon {...p} d={<>
  <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none"/>
  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
  <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none"/>
</>} sw={0} />;

const IconSun = (p) => <Icon {...p} d={<>
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2"/><path d="M12 20v2"/>
  <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
  <path d="M2 12h2"/><path d="M20 12h2"/>
  <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
</>} />;
const IconMoon = (p) => <Icon {...p} d={<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>} />;

const IconGripVertical = (p) => <Icon {...p} sw={0} fill="currentColor" d={<>
  <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
  <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
</>} />;

// Legacy investigate glyph (waveform in circle).
const IconInvestigate = ({ size = 18, active = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity={active ? 1 : 0.85}/>
    <path d="M5 12h2.5l1.5-4 2 8 1.5-5 1 3 1-2h5"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// Google "G" — multi-color, used on login button only.
const IconGoogle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21.35 11.1h-9.17v2.92h5.26c-.22 1.4-1.62 4.1-5.26 4.1-3.17 0-5.75-2.62-5.75-5.86s2.58-5.86 5.75-5.86c1.8 0 3.01.77 3.7 1.43l2.53-2.44C16.87 3.94 14.78 3 12.18 3 7.12 3 3 7.12 3 12.17s4.12 9.17 9.18 9.17c5.3 0 8.82-3.72 8.82-8.96 0-.6-.07-1.06-.15-1.28z" fill="#FFFFFF"/>
  </svg>
);

// Expose to other files (window + globalThis for Babel standalone script order).
const ICON_EXPORTS = {
  Icon, IconPulse, IconBell, IconSettings, IconSearch, IconFilter, IconArchive, IconPlus,
  IconLogout, IconHeadset, IconArrowUpDown, IconArrowUp, IconArrowDown, IconCheck, IconCheckCircle2, IconEye, IconEyeOff, IconAlert, IconTriangle, IconChevronDown, IconHash, IconShieldCheck, IconActivity,
  IconClose, IconXCircle, IconChevron, IconSparkle, IconCopy, IconLink, IconMaximize, IconMinimize, IconMinimize2, IconExternalLink, IconTerminal,
  IconBriefcase, IconMessageSquare, IconDatabase, IconClock, IconCalendar, IconUsers, IconThumbsUp, IconThumbsDown, IconPenLine, IconGripVertical,
  IconLifeBuoy, IconRotateCcw, IconFileText, IconShare, IconUser, IconUserX, IconSend, IconBrain, IconBrainCircuit, IconMoreVertical, IconSun, IconMoon,
  IconInvestigate, IconGoogle,
};
Object.assign(window, ICON_EXPORTS);
Object.assign(globalThis, ICON_EXPORTS);
window.__ICONS_READY__ = true;
