# Stair Configurator Guide

This guide covers editing workflows and input formats supported by the Stair Configurator.

## Editing Existing Configurations

- Opening a stair-config quote item preloads the saved configuration, including:
  - Left and right stringer width, thickness, and material
  - Center stringer (if present)
  - Tread counts and typical widths by type (box/open/double‑open)
  - Special parts
- If the saved configuration lacks nested stringer data, the configurator derives values from:
  - `stringerType` (e.g., `1x9.25` → thickness = 1, width = 9.25)
  - `numStringers`/`centerHorses` to determine center presence

## Input Formats (Fractions + Decimals)

Most numeric fields accept decimals or fractions. Examples:
- `36.25`, `36`, `.5`
- `1/2`, `3/4`, `7/16`
- `1 3/8` or `1-3/8`
- Optional inch symbol is ignored: `36"` → 36

Behavior:
- Values are committed on blur (leaving the field) or Enter. Partial input (e.g., `1/`) won’t be forced to `0` while typing.
- Integer fields (e.g., tread counts, riser count) round to the nearest whole number.

## Save Behavior

- New stair configuration items are added as `STAIR-CONFIG` quote items.
- Editing a stair item replaces the original stair quote item with the updated configuration to avoid partial updates.

## Tips

- Total tread width = Rough Cut + Nose; both fields accept fractions/decimals.
- If a center stringer is included, ensure its width/thickness are set (fractions supported).

