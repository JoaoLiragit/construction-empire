import './style.css';

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

import { createPhysicsWorld } from './core/physics';
import { createWorld } from './world/world';
import { Player } from './player/player';
import { InteractionSystem } from './interaction/interaction';
import { Inventory, MATERIAL_NAMES } from './core/inventory';
import { createMaterialPile } from './world/materials';
import { createMixer } from './construction/mixer';
import { createWall } from './construction/wall';
import { Economy } from './core/economy';
const DEBUG = false;

// Interface
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="game-container"></div>

  <div id="game-hud">
    <div class="game-logo">
      <strong>CONSTRUCTION EMPIRE</strong>
      <span>EARLY DEVELOPMENT</span>
    </div>

    <div id="inventory"></div>
    <div id="toast"></div>

    <div class="player-info">
      <span>TRABALHADOR AUTÔNOMO</span>
      <strong id="money">R$ 500,00</strong>
    </div>

    <div class="controls">
      <strong>CONTROLES</strong>
      <span>W A S D — Movimentar</span>
      <span>SHIFT — Correr</span>
      <span>ESPAÇO — Pular</span>
      <span>E — Interagir</span>
      <span>MOUSE — Câmera</span>
      <span>ESC — Liberar mouse</span>
    </div>

    <div id="start-message">
      <div>
        <strong>CONSTRUCTION EMPIRE</strong>
        <p>Clique na tela para controlar o personagem</p>
      </div>
    </div>

    <div class="crosshair">+</div>

    <div id="interaction-prompt"></div>

    <div class="bottom-info">
      PROTÓTIPO 0.1 — AMBIENTE DE TESTE
    </div>
  </div>
`;

async function startGame() {
  // Física
  await RAPIER.init();
  const physics = createPhysicsWorld();

  // Cena
  const scene = new THREE.Scene();

  // Câmera
  const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );

  // Interação e inventário
  const interaction = new InteractionSystem();
  const inventory = new Inventory();

  const invEl = document.querySelector('#inventory') as HTMLDivElement;

  inventory.onChange = () => {
    const rows = inventory
      .entries()
      .map(([id, q]) => `<span>${MATERIAL_NAMES[id]}: ${q}</span>`)
      .join('');

    invEl.innerHTML =
      '<strong>INVENTÁRIO</strong>' + (rows || '<span>vazio</span>');
  };
  inventory.onChange();


const economy = new Economy();
const moneyEl = document.querySelector('#money') as HTMLElement;

  economy.onChange = () => {
  moneyEl.textContent = economy.format();
  };
  economy.onChange();

  // Mensagens na tela
  const toastEl = document.querySelector('#toast') as HTMLDivElement;
  let toastTimer: number | undefined;

  function notify(text: string) {
    toastEl.textContent = text;
    toastEl.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.style.display = 'none';
    }, 2500);
  }

  // Renderizador
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  document
    .querySelector('#game-container')!
    .appendChild(renderer.domElement);

  // Mundo
  createWorld(scene, physics);

  // Personagem
  const player = new Player(scene, physics);

  // Pilhas de material
  createMaterialPile(scene, interaction, inventory, economy, notify, {
    id: 'tijolo', position: new THREE.Vector3(-4, 0, 0),
    color: 0xb5523b, size: [1.2, 0.6, 0.8], stock: 40, perPickup: 5, price: 1.2
  });

  createMaterialPile(scene, interaction, inventory, economy, notify, {
    id: 'areia', position: new THREE.Vector3(-4, 0, -3),
    color: 0xd8c27a, size: [1.4, 0.7, 1.2], stock: 30, perPickup: 5, price: 8
  });

  createMaterialPile(scene, interaction, inventory, economy, notify, {
    id: 'cimento', position: new THREE.Vector3(-4, 0, -6),
    color: 0x9a9a9a, size: [0.8, 0.5, 0.6], stock: 20, perPickup: 2, price: 12
  });

  createMaterialPile(scene, interaction, inventory, economy, notify, {
    id: 'agua', position: new THREE.Vector3(-7, 0, -6),
    color: 0x3b7fc4, size: [0.6, 0.9, 0.6], stock: 20, perPickup: 5, price: 2
  });

  // Betoneira
  createMixer(
    scene,
    interaction,
    inventory,
    notify,
    new THREE.Vector3(-8, 0, -2)
  );

  // Parede
  const WALL_PAYMENT = 450;

createWall(
  scene,
  interaction,
  inventory,
  notify,
  new THREE.Vector3(-12, 0, -10),
  () => {
    economy.earn(WALL_PAYMENT);
    notify(`Serviço concluído! Você recebeu ${economy.format(WALL_PAYMENT)}`);
  }
);

  // Captura do mouse
  renderer.domElement.addEventListener('click', () => {
    if (document.pointerLockElement !== renderer.domElement) {
      renderer.domElement.requestPointerLock();
    }
  });

  document.addEventListener('mousemove', (event) => {
    player.handleMouseMove(event);
  });

  // Mensagem inicial
  const startMessage = document.querySelector(
    '#start-message'
  ) as HTMLDivElement;

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === renderer.domElement;
    startMessage.style.display = locked ? 'none' : 'flex';
  });

  // Câmera
  const cameraTarget = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const cameraDistance = 6;

  const timer = new THREE.Timer();
  let accumulator = 0;
  const fixedStep = 1 / 60;

  function animate() {
    requestAnimationFrame(animate);

    timer.update();
    const delta = Math.min(timer.getDelta(), 0.1);

    // Física em passos fixos
    accumulator += delta;

    while (accumulator >= fixedStep) {
      player.update(fixedStep);
      physics.step();
      accumulator -= fixedStep;
    }

    player.syncVisual();

    if (DEBUG && performance.now() % 500 < 16) {
      console.log('pos', player.getPosition(), 'keys', { ...player.keys });
    }

    const position = player.getPosition();

    cameraTarget.set(position.x, position.y + 0.8, position.z);

    const yaw = player.cameraYaw;
    const pitch = player.cameraPitch;

    cameraPosition.set(
      cameraTarget.x + Math.sin(yaw) * cameraDistance * Math.cos(pitch),
      cameraTarget.y + cameraDistance * Math.sin(pitch),
      cameraTarget.z + Math.cos(yaw) * cameraDistance * Math.cos(pitch)
    );

    camera.position.lerp(cameraPosition, 1 - Math.pow(0.001, delta));
    camera.lookAt(cameraTarget);

    // Interação (depois de posicionar a câmera)
    interaction.update(camera, position);

    renderer.render(scene, camera);
  }

  // Redimensionamento
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();

  console.log('Construction Empire iniciado!');
}

startGame().catch((error) => {
  console.error('Erro ao iniciar o jogo:', error);

  document.querySelector('#game-container')!.innerHTML =
    '<div style="color:white;padding:30px">Erro ao iniciar o jogo. Verifique o console.</div>';
});