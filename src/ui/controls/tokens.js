// ===================================================================
// DIW-003 Gameplay Design Tokens
// Defined according to the visual specification in DIW-002 and
// Section 1 of Diwali_Gameplay_Jira_Backlog.md
// ===================================================================

export const GAMEPLAY_TOKENS = {
  colors: {
    // Backdrop / Scene
    bgNightIndigo: '#11122b',
    bgNightPlum: '#30203d',

    // Surfaces (solid opaque, blur-independent)
    surfacePlum: '#271b35',
    surfaceRaised: '#382543',
    surfaceOverlay: 'rgba(39, 27, 53, 0.95)',

    // Text hierarchy
    textIvory: '#fff4df',       // Primary instructions & prominent headings
    textSecondary: '#d6c6b2',   // Secondary metadata (>=14px)
    textMuted: '#a39587',       // Captions & disabled/locked hints

    // Primary action
    actionMarigold: '#f3bb56',
    actionMarigoldHover: '#ffc96b',
    actionMarigoldActive: '#e2a842',
    actionText: '#281a15',

    // State accents
    accentTeal: '#61c9be',      // Selected / status
    accentTealDark: '#1b4b45',
    accentRose: '#e981a0',      // Decorative highlights / alerts
    accentRoseDark: '#4d1d2c',
    accentGold: '#f5c358',

    // Borders & Focus
    borderPlum: 'rgba(214, 198, 178, 0.18)',
    borderPlumLight: 'rgba(214, 198, 178, 0.32)',
    borderFocus: '#f3bb56',
    borderFocusOffset: '#271b35',

    // Status / Notice pairs
    statusSelectedBg: 'rgba(97, 201, 190, 0.16)',
    statusSelectedBorder: '#61c9be',
    statusLockedBg: 'rgba(39, 27, 53, 0.85)',
    statusLockedText: '#a39587',
    statusErrorBg: '#4a1924',
    statusErrorBorder: '#e981a0',
    statusErrorText: '#ffd5dc',
    statusInfoBg: '#1c2b3d',
    statusInfoBorder: '#61c9be',
    statusInfoText: '#def3f1',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 8,
    control: 12,
    card: 16,
    panel: 22,
    pill: 9999,
  },
  targets: {
    min: 44, // 44px minimum touch target size (WCAG 2.5.5 / 2.5.8)
  },
  typography: {
    fontStack: "'Segoe UI', system-ui, -apple-system, sans-serif",
    instructionSize: 16,
    instructionLine: 24,
    secondarySize: 14,
    secondaryLine: 21,
    headingSize: 24,
    headingLine: 32,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightSemibold: 600,
    fontWeightBold: 700,
  },
  motion: {
    fastMs: 140,
    normalMs: 200,
  },
}
