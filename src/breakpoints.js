// Sync with index.html @media and chia/src/apolo/lib/breakpoints.ts

const BREAKPOINT = {
  SM: 640,
  TABLET: 768,
  DESKTOP: 1024,
  XL: 1280,
  XXL: 1536,
};

Object.assign(window, { BREAKPOINT });
