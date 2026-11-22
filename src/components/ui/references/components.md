# `@/components/ui` Component Reference

## `Button`
- **Variants**: `"primary" | "secondary" | "outline" | "ghost" | "danger" | "amber" | "emerald"` (default `"outline"`)
- **Sizes**: `"xs" | "sm" | "md" | "icon" | "icon-sm"` (default `"sm"`)

```tsx
import { Button } from "@/components/ui";

<Button variant="primary" size="md" onClick={handleSave}>
  Save Changes
</Button>
```

---

## `Input`
- **Props**: All `React.InputHTMLAttributes<HTMLInputElement>` plus `leftIcon?: React.ReactNode`, `rightElement?: React.ReactNode`, `containerClassName?: string`.

```tsx
import { Search } from "lucide-react";
import { Input } from "@/components/ui";

<Input
  leftIcon={<Search className="w-3.5 h-3.5" />}
  placeholder="Search..."
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
```

---

## `Badge` & `Alert` & `Card`
- **`Badge` variants**: `"neutral" | "amber" | "emerald" | "red" | "blue"`
- **`Alert` variants**: `"info" | "warning" | "error" | "success"` (supports `icon?: React.ReactNode`)
- **`Card`**: Elevated container (`rounded-2xl border shadow-2xl`).

```tsx
import { Alert, Badge, Card } from "@/components/ui";

<Badge variant="emerald">Public Link</Badge>
<Alert variant="error" icon={<AlertCircle className="w-4 h-4" />}>
  Something went wrong.
</Alert>
```

---

## `Checkbox` & `Switch`
- **`Checkbox`**: `checked`, `onChange(checked)`, `label?`, `description?`, `disabled?`, `id?`.
- **`Switch`**: `checked`, `onChange(checked)`, `disabled?`, `label?`.

```tsx
import { Checkbox, Switch } from "@/components/ui";

<Checkbox
  checked={enabled}
  onChange={setEnabled}
  label="Show Grid"
  description="Display primary grid lines on the canvas"
/>

<Switch checked={isPublic} onChange={setIsPublic} label="Public access" />
```

---

## `Modal`
- **`Modal`**: `isOpen`, `onClose`, `maxWidthClassName?` (default `"max-w-md"`), `className?`.
- **`ModalHeader`**: `title`, `subtitle?`, `icon?`, `onClose?`.
- **`ModalBody` / `ModalFooter`**: Layout helpers.

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@/components/ui";

<Modal isOpen={open} onClose={() => setOpen(false)}>
  <ModalHeader title="Confirm" subtitle="Are you sure?" onClose={() => setOpen(false)} />
  <ModalBody>...</ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="primary" onClick={onConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

---

## `SideSheet`
- **`SideSheet`**: `isOpen`, `onClose`, `side?: "left" | "right"`, `modal?: boolean` (default `false` for non-blocking canvas sheets), `widthClassName?` (default `"w-80 sm:w-96"`).
- **`SideSheetHeader` / `SideSheetBody` / `SideSheetFooter`**: Standard slide-over structure.

```tsx
import { SideSheet, SideSheetHeader, SideSheetBody, SideSheetFooter } from "@/components/ui";

<SideSheet isOpen={isOpen} onClose={onClose} side="right" modal={false}>
  <SideSheetHeader title="Preferences" onClose={onClose} />
  <SideSheetBody>...</SideSheetBody>
  <SideSheetFooter>...</SideSheetFooter>
</SideSheet>
```

---

## `Dropdown`
- **`Dropdown`**: `isOpen`, `onClose`, `trigger`, `align?: "left" | "right"`, `widthClassName?`.
- **`DropdownItem`**: `icon?`, `checked?`, `shortcut?`, `disabled?`, `onClick`.
- **`DropdownSubmenu`**: `label`, `icon?`, `checked?`, `onTriggerClick?`.
- **`DropdownSeparator`**: Visual divider.

```tsx
import { Dropdown, DropdownItem, DropdownSubmenu, DropdownSeparator } from "@/components/ui";

<Dropdown isOpen={open} onClose={() => setOpen(false)} trigger={<Button>View</Button>}>
  <DropdownSubmenu label="Grid" checked={showGrid} onTriggerClick={toggleGrid}>
    <DropdownItem checked={showMajorGrid} disabled={!showGrid} onClick={toggleMajorGrid}>
      Major Grid
    </DropdownItem>
  </DropdownSubmenu>
  <DropdownSeparator />
  <DropdownItem onClick={toggleTheme}>Toggle Theme</DropdownItem>
</Dropdown>
```
