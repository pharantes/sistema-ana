FormLayout primitives

Purpose

This small helper provides lightweight styled-components (primitives) to keep form and modal layouts consistent across the app. Use these in new components or migrate existing forms for consistent spacing and behavior.

Exports

- Label: styled label (bold, block)
- FormRow: horizontal row for inputs and small buttons
- FormGrid: top-level grid for stacked inputs
- Note: small note/italic text for confirmations or minor hints (accepts `error` prop to color red, and `italic` for italic)
- Actions: container for form action buttons (right aligned)
- DropdownWrapper: wrapper with relative positioning for dropdowns
- DropdownButton: the toggle that shows the dropdown panel
- DropdownPanel: absolute-positioned panel (search + list)
- DropdownInput: input inside panel for filtering
- OptionItem: single selectable option (accepts `highlight` prop)
- EmptyMessage: message shown when a list is empty

Example

import { Label, FormGrid, Actions } from "./FormLayout";

<FormGrid as="form" onSubmit={...}>
  <div>
    <Label>Nome</Label>
    <input name="nome" />
  </div>
  <Actions>
    <button type="button">Cancelar</button>
    <button type="submit">Salvar</button>
  </Actions>
</FormGrid>

Notes

- Buttons: the codebase already has `FormElements` with `Button` / `SecondaryButton` / `InlineButton` — prefer using those for consistent semantics and color tokens. The layout primitives are intentionally un-opinionated about color.
- Keep dropdown panels keyboard accessible — the primitives simply provide layout; keep existing keyboard handlers when implementing dropdowns.

If you want, I can move these to a top-level `components/ui/` folder and add a simple test or story for them.