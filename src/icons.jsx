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
const IconSort = (p) => <Icon {...p} d={<>
  <path d="M8 4v16"/><path d="M5 7l3-3 3 3"/>
  <path d="M16 20V4"/><path d="M13 17l3 3 3-3"/>
</>} />;
const IconArrowDown = (p) => <Icon {...p} d={<><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></>} />;
const IconCheck = (p) => <Icon {...p} d="M5 12l5 5L20 7" />;
const IconEye = (p) => <Icon {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />;
const IconAlert = (p) => <Icon {...p} d={<><path d="M10.3 3.86a2 2 0 0 1 3.4 0l8.2 14.14A2 2 0 0 1 20.2 21H3.8a2 2 0 0 1-1.7-3L10.3 3.86z"/><path d="M12 9v5"/><path d="M12 17.5v.01"/></>} />;
const IconActivity = (p) => <Icon {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />;
const IconClose = (p) => <Icon {...p} d={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>} />;
const IconChevron = (p) => <Icon {...p} d="m9 18 6-6-6-6" />;
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
const IconTerminal = (p) => <Icon {...p} d={<>
  <path d="m4 9 4 3-4 3"/><path d="M12 15h8"/>
  <rect x="2" y="4" width="20" height="16" rx="2"/>
</>} />;

// The "investigate" glyph — signal waveform inside a circle. Our replacement for the brain icon.
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

// Expose to other files
Object.assign(window, {
  Icon, IconPulse, IconBell, IconSettings, IconSearch, IconFilter, IconArchive, IconPlus,
  IconLogout, IconHeadset, IconSort, IconArrowDown, IconCheck, IconEye, IconAlert, IconActivity,
  IconClose, IconChevron, IconSparkle, IconCopy, IconLink, IconTerminal, IconInvestigate, IconGoogle
});
