export type MaterialId = 'tijolo' | 'areia' | 'cimento' | 'agua' | 'argamassa';

export const MATERIAL_NAMES: Record<MaterialId, string> = {
  tijolo: 'Tijolos',
  areia: 'Areia',
  cimento: 'Cimento',
  agua: 'Água',
  argamassa: 'Argamassa'
};

export class Inventory {
  private items = new Map<MaterialId, number>();
  onChange: () => void = () => {};

  get(id: MaterialId) {
    return this.items.get(id) ?? 0;
  }

  has(id: MaterialId, qty = 1) {
    return this.get(id) >= qty;
  }

  add(id: MaterialId, qty = 1) {
    this.items.set(id, this.get(id) + qty);
    this.onChange();
  }

  remove(id: MaterialId, qty = 1): boolean {
    if (!this.has(id, qty)) return false;
    this.items.set(id, this.get(id) - qty);
    this.onChange();
    return true;
  }

  entries() {
    return [...this.items.entries()].filter(([, q]) => q > 0);
  }
}