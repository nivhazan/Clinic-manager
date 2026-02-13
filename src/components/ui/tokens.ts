/**
 * Design System Tokens
 * Single source of truth for all design constants
 */

// ============================================
// COLOR TOKENS
// ============================================

export const colors = {
  // Semantic colors (map to CSS variables)
  primary: 'hsl(var(--primary))',
  primaryForeground: 'hsl(var(--primary-foreground))',

  // Status colors - GLOBAL CONSISTENCY
  success: '#16a34a',  // GREEN - paid, completed, active
  warning: '#facc15',  // YELLOW - pending, waiting
  danger: '#dc2626',   // RED - debt, overdue, error, destructive

  // Neutral scale
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
} as const

// ============================================
// TYPOGRAPHY TOKENS
// ============================================

export const typography = {
  fontFamily: {
    base: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

// ============================================
// SPACING TOKENS
// ============================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
} as const

// ============================================
// RADIUS TOKENS
// ============================================

export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px - DEFAULT
  xl: '1rem',       // 16px
  full: '9999px',
} as const

// Default radius for components
export const DEFAULT_RADIUS = radius.lg

// ============================================
// SHADOW TOKENS
// ============================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  modal: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const

// ============================================
// Z-INDEX TOKENS
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
} as const

// ============================================
// ANIMATION TOKENS
// ============================================

export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

// ============================================
// COMPONENT SIZE TOKENS
// ============================================

export const componentSizes = {
  // Height for inputs, buttons, selects
  input: {
    sm: 'h-8',      // 32px
    md: 'h-10',     // 40px - DEFAULT
    lg: 'h-12',     // 48px
  },

  // Icon sizes
  icon: {
    xs: 'h-3 w-3',  // 12px
    sm: 'h-4 w-4',  // 16px
    md: 'h-5 w-5',  // 20px
    lg: 'h-6 w-6',  // 24px
  },
} as const

// ============================================
// STATUS COLOR MAPPINGS (Tailwind classes)
// ============================================

export const statusColors = {
  success: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-700',
    solid: 'bg-green-600 text-white',
  },
  warning: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    text: 'text-yellow-700',
    solid: 'bg-yellow-600 text-white',
  },
  danger: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-700',
    solid: 'bg-red-600 text-white',
  },
  info: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-700',
    solid: 'bg-blue-600 text-white',
  },
  neutral: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-700',
    solid: 'bg-gray-600 text-white',
  },
} as const

export type StatusType = keyof typeof statusColors
