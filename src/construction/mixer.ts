import * as THREE from 'three';
import type { InteractionSystem } from '../interaction/interaction';
import type { Inventory, MaterialId } from '../core/inventory';

const MORTAR_RECIPE: Record<string, number> = { areia: 3, cimento: 1, agua: 1 };
const MORTAR_YIELD = 4;

export function createMixer(
  scene: THREE.Scene,
  interaction: InteractionSystem,
  inventory: Inventory,
  notify: (text: string) => void,
  position: THREE.Vector3
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.4, 0.9, 16),
    new THREE.MeshStandardMaterial({ color: 0xd9822b, roughness: 0.7 })
  );
  mesh.position.set(position.x, 0.45, position.z);
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);

  interaction.register({
    object: mesh,
    name: 'Betoneira',
    prompt: 'E — Misturar argamassa (3 areia + 1 cimento + 1 água)',
    onInteract: () => {
      const entries = Object.entries(MORTAR_RECIPE) as [MaterialId, number][];
      const missing = entries.filter(([id, q]) => !inventory.has(id, q));

      if (missing.length > 0) {
        notify('Faltam materiais para a argamassa');
        return;
      }

      entries.forEach(([id, q]) => inventory.remove(id, q));
      inventory.add('argamassa', MORTAR_YIELD);
      notify(`Argamassa pronta (+${MORTAR_YIELD})`);
    }
  });
}