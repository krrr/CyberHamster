## 2024-05-20 - Adding Empty States using Ng-Zorro-Antd
**Learning:** Utilizing `<nz-empty>` from `ng-zorro-antd` for empty states is effective. Adding a helpful CTA like "Create First Task" directly within the `<nz-empty>` tag works perfectly to guide new users, instead of displaying a blank or confusing UI when no tasks are present.
**Action:** Consistently check lists or tables for empty states and implement `<nz-empty>` with clear, actionable CTAs where appropriate.

## 2026-04-02 - Clickable nz-card Keyboard Accessibility
**Learning:** Using `(click)` on `<nz-card>` to make entire cards interactive does not natively provide keyboard accessibility. They are omitted from the tab order and cannot be triggered by Enter/Space.
**Action:** When making custom components like `<nz-card>` clickable, explicitly add `tabindex="0"`, `role="button"`, an appropriate `aria-label`, an `(keydown.enter)` handler, and `:focus-visible` styling.
