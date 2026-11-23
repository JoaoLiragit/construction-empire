import * as THREE from 'three';

export interface Interactable {
  object: THREE.Object3D;
  name: string;
  prompt: string;
  onInteract: () => void;
}

export class InteractionSystem {
  private raycaster = new THREE.Raycaster();
  private center = new THREE.Vector2(0, 0);
  private items: Interactable[] = [];
  private current: Interactable | null = null;
  private promptEl: HTMLDivElement;
  private interactRequested = false;
  private tmp = new THREE.Vector3();

  // Distância máxima entre o personagem e o objeto
  maxDistance = 3.5;

  constructor() {
    this.promptEl = document.querySelector(
      '#interaction-prompt'
    ) as HTMLDivElement;

    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyE' && !event.repeat) {
        this.interactRequested = true;
      }
    });

    window.addEventListener('blur', () => {
      this.interactRequested = false;
    });
  }

  register(item: Interactable) {
    this.items.push(item);
  }

  unregister(item: Interactable) {
    this.items = this.items.filter((i) => i !== item);

    if (this.current === item) {
      this.current = null;
      this.hidePrompt();
    }
  }

  // Chamar todo frame, depois de posicionar a câmera
  update(camera: THREE.Camera, playerPosition: THREE.Vector3) {
    camera.updateMatrixWorld();

    // A câmera fica atrás do personagem (6 m), então o raio precisa ser longo
    this.raycaster.setFromCamera(this.center, camera);
    this.raycaster.far = 20;

    const hits = this.raycaster.intersectObjects(
      this.items.map((i) => i.object),
      true
    );

    let target: Interactable | null = null;

    for (const hit of hits) {
      const item = this.findItem(hit.object);

      if (!item) continue;

      item.object.getWorldPosition(this.tmp);

      if (this.tmp.distanceTo(playerPosition) <= this.maxDistance) {
        target = item;
      }

      // Só o primeiro objeto atingido conta
      break;
    }

    if (target !== this.current) {
      this.current = target;

      if (target) {
        this.showPrompt(target.prompt);
      } else {
        this.hidePrompt();
      }
    }

    if (this.interactRequested && this.current) {
      this.current.onInteract();
    }

    this.interactRequested = false;
  }

  // Sobe na hierarquia até achar o objeto registrado
  private findItem(object: THREE.Object3D): Interactable | null {
    let node: THREE.Object3D | null = object;

    while (node) {
      const found = this.items.find((i) => i.object === node);

      if (found) return found;

      node = node.parent;
    }

    return null;
  }

  private showPrompt(text: string) {
    this.promptEl.textContent = text;
    this.promptEl.style.display = 'block';
  }

  private hidePrompt() {
    this.promptEl.style.display = 'none';
  }
}
