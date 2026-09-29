// Kept apart from lib/tour-steps.ts (which imports the page tours) to avoid a circular import.

/** Selector for an element marked with data-tour="id" in a page's JSX. */
export const tourTarget = (id: string) => `[data-tour="${id}"]`;

/** Selector for the breadcrumb trail shown at the top of the drill-down pages. */
export const BREADCRUMB = 'main nav[aria-label="Breadcrumb"]';
