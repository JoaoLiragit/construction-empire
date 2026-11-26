import * as THREE from 'three';
import type { Interactable, InteractionSystem } from '../interaction/interaction';
import type { Inventory } from '../core/inventory';

export function createWall(
  scene: THREE.Scene,
  interaction: InteractionSystem,
  inventory: Inventory,
  notify: (text: string) => void,
  origin: THREE.Vector3,
  onComplete?: () => void
) {
  const cols = 6;
  const rows = 4;
  const w = 0.6;
  const h = 0.3;
  const d = 0.3;
  const total = cols * rows;

  const group = new THREE.Group();
  group.position.copy(origin);
  scene.add(group);

  const geometry = new THREE.BoxGeometry(w * 0.97, h * 0.95, d);

  const solidMat = new THREE.MeshStandardMaterial({
    color: 0xb5523b,
    roughness: 0.9
  });

  const ghostMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.3
  });

  let index = 0;

  // Posição de cada tijolo, de baixo para cima, com amarração alternada
  function slotPosition(i: number) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const offset = row % 2 === 1 ? w / 2 : 0;

    return new THREE.Vector3(
      (col - (cols - 1) / 2) * w + offset,
      h / 2 + row * h,
      0
    );
  }

  // Registra apenas o próximo tijolo da sequência
  function registerNext() {
    if (index >= total) {
      notify('Parede concluída!');
      onComplete?.();
      return;
    }

    const pos = slotPosition(index);

    const ghost = new THREE.Mesh(geometry, ghostMat);
    ghost.position.copy(pos);
    group.add(ghost);

    const item: Interactable = {
      object: ghost,
      name: 'Tijolo da parede',
      prompt: `E — Assentar tijolo (${index + 1}/${total})`,
      onInteract: () => {
        if (!inventory.has('tijolo') || !inventory.has('argamassa')) {
          notify('Você precisa de 1 tijolo e 1 argamassa');
          return;
        }

        inventory.remove('tijolo', 1);
        inventory.remove('argamassa', 1);

        group.remove(ghost);
        interaction.unregister(item);

        const brick = new THREE.Mesh(geometry, solidMat);
        brick.position.copy(pos);
        brick.castShadow = true;
        brick.receiveShadow = true;
        group.add(brick);

        index++;
        registerNext();
      }
    };

    interaction.register(item);
  }

  registerNext();
}