/**
 * Component library barrel export.
 * Import path for teammates: import { ListView, FormView, ... } from '@/components'
 * (or relative: from '../../components')
 *
 * Aman and Aryan: all components are here. Do not import from sub-paths.
 */

// UI primitives
export { default as Money } from './ui/Money';
export { default as StatusBadge } from './ui/StatusBadge';
export { default as SmartButton } from './ui/SmartButton';
export { default as BlockingWarning } from './ui/BlockingWarning';
export { default as NonBlockingWarning } from './ui/NonBlockingWarning';

// Data display
export { default as ListView } from './ui/ListView';
export type { ListColumn } from './ui/ListView';

// Form primitives
export { default as FormView } from './ui/FormView';
export { btnPrimary, btnSecondary, btnGhost, btnDestructive } from './ui/FormView';
export { default as LineItemGrid } from './ui/LineItemGrid';
export type { GridColumn, GridRow } from './ui/LineItemGrid';

// Feedback & Phase 6 Polish
export { ToastProvider, useToast } from './ui/Toast';
export type { ToastType, ToastItem } from './ui/Toast';
export { default as FlashNumber } from './ui/FlashNumber';
export { default as EmptyState } from './ui/EmptyState';
export { default as LoadingState } from './ui/LoadingState';

// Layout
export { default as AppShell } from './layout/AppShell';
