// chia/src/apolo/hooks/use-mobile.ts — viewport tiers for layout switches

function subscribeMatchMedia(query, callback) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia(query);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function useBreakpoint(maxWidth) {
  const query = `(max-width: ${maxWidth - 1}px)`;
  const subscribe = React.useCallback(
    (cb) => subscribeMatchMedia(query, cb),
    [query],
  );
  const getSnapshot = React.useCallback(
    () => typeof window !== 'undefined' && window.innerWidth < maxWidth,
    [maxWidth],
  );
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function useIsMobile() {
  return useBreakpoint(window.BREAKPOINT.TABLET);
}

function useIsTablet() {
  const belowDesktop = useBreakpoint(window.BREAKPOINT.DESKTOP);
  const belowTablet = useBreakpoint(window.BREAKPOINT.TABLET);
  return belowDesktop && !belowTablet;
}

function useIsDesktop() {
  return !useBreakpoint(window.BREAKPOINT.DESKTOP);
}

Object.assign(window, { useBreakpoint, useIsMobile, useIsTablet, useIsDesktop });
