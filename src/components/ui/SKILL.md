---
name: relayflow-ui
description: >-
  Guides usage, composition, and cross-project portability of the `@/components/ui`
  component library. Use when building, editing, or refactoring UI elements (modals,
  side sheets, dropdowns, buttons, inputs, badges, checkboxes, switches, cards, alerts).
---

# RelayFlow Portable UI Library (`@/components/ui`)

A lightweight, zero-overlay-dependency React + Tailwind CSS v4 component library extracted from RelayFlow. Designed to be copied directly into any React/Next.js project.

## Prerequisites & Dark Mode Setup

1. **Dependencies**: `react`, `lucide-react`, `clsx`, `tailwind-merge`.
2. **Class helper**: `src/lib/utils.ts` exporting `cn(...inputs)`.
3. **Tailwind v4 Dark Mode**: Add the class-based dark variant to `globals.css`:
   ```css
   @custom-variant dark (&:where(.dark, .dark *));
   ```

## Component Quick Reference

Import all primitives from `@/components/ui`:

| Component | Exports | Primary Use |
| :--- | :--- | :--- |
| `Button` | `Button`, `ButtonProps`, `ButtonVariant`, `ButtonSize` | Actions, icon buttons, toolbar controls |
| `Input` | `Input`, `InputProps` | Text fields with optional `leftIcon` / `rightElement` |
| `Badge` | `Badge`, `BadgeProps`, `BadgeVariant` | Status pills (`neutral`, `amber`, `emerald`, `red`, `blue`) |
| `Card` | `Card`, `CardProps` | Elevated surface containers |
| `Alert` | `Alert`, `AlertProps`, `AlertVariant` | Inline notices, warnings, and errors |
| `Checkbox` | `Checkbox`, `CheckboxProps` | Labeled checkbox with optional description & disabled state |
| `Switch` | `Switch`, `SwitchProps` | Compact boolean toggle switch |
| `Modal` | `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter` | Centered dialogs with Escape & backdrop close |
| `SideSheet` | `SideSheet`, `SideSheetHeader`, `SideSheetBody`, `SideSheetFooter` | Slide-over panels (`modal={false}` for non-blocking inspectors) |
| `Dropdown` | `Dropdown`, `DropdownItem`, `DropdownSeparator`, `DropdownSubmenu` | Menus with click-outside, Escape, checkmarks, & flyout submenus |

For full prop signatures and code examples, see [references/components.md](./references/components.md).

## Composition Rules

- **Always use `@/components/ui` primitives** before writing raw `fixed inset-0` modals, custom Escape listeners, or repeated button/input Tailwind strings.
- **Modals**: Always compose `Modal` + `ModalHeader` (handles Escape and backdrop click automatically).
- **Non-blocking Inspectors**: Use `SideSheet` with `modal={false}` when users must still interact with the background canvas while the panel is open. Use `modal={true}` for mobile navigation drawers.
- **Dropdowns & Submenus**: Use `Dropdown` + `DropdownItem` + `DropdownSubmenu` instead of manual `document.addEventListener("mousedown", ...)` handlers.
- **Domain Canvas Components**: Keep specialized SVG/canvas elements (e.g., `FlowCanvas`, `FlowNode`, `FlowWire`, `SymbolRenderer`) separate from generic UI chrome.

## Copying to Another Project

1. Copy `src/components/ui/` and `src/lib/utils.ts` into the target project.
2. Install `clsx`, `tailwind-merge`, and `lucide-react` if not present.
3. Ensure `@custom-variant dark (&:where(.dark, .dark *));` is in the target `globals.css` and `@/*` path alias points to `./src/*`.
