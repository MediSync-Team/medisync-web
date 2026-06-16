/** Inline feedback banner shown in modals, panels and dashboards. */
export type NoticeKind = 'success' | 'error' | 'info';

export interface Notice {
  type: NoticeKind;
  text: string;
}
