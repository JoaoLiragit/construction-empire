import * as THREE from 'three';
import type { InteractionSystem } from '../interaction/interaction';
import type { Inventory, MaterialId } from '../core/inventory';
import { MATERIAL_NAMES } from '../core/inventory';
import type { Economy } from '../core/economy';

interface PileOptions {
  id: MaterialId;
  position: THREE.Vector3;
  color: number;
  size: [number, number, number];
  stock: number;
  perPickup: number;
  price: number;
}

export function createMaterialPile(
  scene: THREE.Scene,
  interaction: InteractionSystem,
  inventory: Inventory,
  economy: Economy,
  notify: (text: string) => void,
  o: PileOptions
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...o.size),
    new THREE.MeshStandardMaterial({ color: o.color, roughness: 0.9 })
  );
  mesh.position.copy(o.position);
  mesh.position.y = o.size[1] / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  let stock = o.stock;
  const name = MATERIAL_NAMES[o.id];

  const label = () => {
    const cost = o.price * Math.min(o.perPickup, stock);
    return `E — Comprar ${o.perPickup} ${name.toLowerCase()} (${economy.format(cost)})`;
  };

  const item = {
    object: mesh,
    name,
    prompt: label(),
    onInteract: () => {
      const qty = Math.min(o.perPickup, stock);
      const cost = o.price * qty;

      if (!economy.spend(cost)) {
        notify(`Dinheiro insuficiente (${economy.format(cost)})`);
        return;
      }

      inventory.add(o.id, qty);
      stock -= qty;
      item.prompt = label();

      if (stock <= 0) {
        scene.remove(mesh);
        interaction.unregister(item);
      }
    }
  };

  interaction.register(item);
}