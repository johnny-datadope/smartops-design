// Tweaks panel — exposed via the ?Tweaks toolbar toggle.
function TweaksPanel({ open, tweaks, setTweaks, onClose }) {
  React.useEffect(() => {
    window.parent.postMessage({ type:'__edit_mode_set_keys', edits: tweaks }, '*');
  }, [tweaks]);

  if (!open) return null;

  return (
    <div style={{
      position:'fixed', right:16, bottom:16, zIndex:60,
      width:280,
      background:'var(--bg-2)',
      border:'1px solid var(--line-2)',
      borderRadius:12,
      padding:14,
      boxShadow:'0 30px 60px -20px rgba(0,0,0,0.5)',
      fontSize:12,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ fontWeight:600, letterSpacing:'-0.01em' }}>Tweaks</div>
        <button onClick={onClose} style={{ color:'var(--fg-3)' }}><IconClose size={14}/></button>
      </div>

      <Row label="Accent hue">
        <input type="range" min="0" max="360" step="5"
          value={tweaks.accentHue}
          onChange={e => setTweaks({ ...tweaks, accentHue: +e.target.value })}
          style={{ flex:1 }}/>
        <span className="mono" style={{ width:36, textAlign:'right', color:'var(--fg-3)' }}>{tweaks.accentHue}°</span>
      </Row>

      <Row label="Density">
        {['comfortable','compact'].map(d => (
          <button key={d}
            onClick={() => setTweaks({ ...tweaks, density: d })}
            style={pillStyle(tweaks.density === d)}>{d}</button>
        ))}
      </Row>

      <Row label="Row style">
        {['zebra','flat'].map(d => (
          <button key={d}
            onClick={() => setTweaks({ ...tweaks, rowStyle: d })}
            style={pillStyle(tweaks.rowStyle === d)}>{d}</button>
        ))}
      </Row>

      <Row label="Stat cards">
        {['numbers','with-trend'].map(d => (
          <button key={d}
            onClick={() => setTweaks({ ...tweaks, statsStyle: d })}
            style={pillStyle(tweaks.statsStyle === d)}>{d}</button>
        ))}
      </Row>

      <Row label="Labels">
        {['chip','dot'].map(d => (
          <button key={d}
            onClick={() => setTweaks({ ...tweaks, labelStyle: d })}
            style={pillStyle(tweaks.labelStyle === d)}>{d}</button>
        ))}
      </Row>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'10px 0' }}>
      <div style={{ width:80, color:'var(--fg-3)', fontSize:11 }}>{label}</div>
      <div style={{ flex:1, display:'flex', gap:6, alignItems:'center' }}>{children}</div>
    </div>
  );
}

function pillStyle(active) {
  return {
    padding:'4px 9px', borderRadius:99, fontSize:11,
    border:`1px solid ${active ? 'var(--accent-2)' : 'var(--line-2)'}`,
    background: active ? 'var(--accent-glow)' : 'var(--bg-3)',
    color: active ? 'var(--accent)' : 'var(--fg-2)',
  };
}

Object.assign(window, { TweaksPanel });
