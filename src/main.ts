import './style.css';

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

import { createPhysicsWorld } from './core/physics';
import { createWorld } from './world/world';
import { Player } from './player/player';
import { InteractionSystem } from './interaction/interaction';

const DEBUG = false;

// Interface
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="game-container"></div>

  <div id="game-hud">
    <div class="game-logo">
      <strong>CONSTRUCTION EMPIRE</strong>
      <span>EARLY DEVELOPMENT</span>
    </div>

    <div class="player-info">
      <span>TRABALHADOR AUTÔNOMO</span>
      <strong>R$ 0,00</strong>
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
  // Inicializar física
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

  // Interação
  const interaction = new InteractionSystem();

  // Objeto de teste: pilha de tijolos
  const brickPile = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.6, 0.8),
    new THREE.MeshStandardMaterial({
      color: 0xb5523b,
      roughness: 0.9
    })
  );

  brickPile.position.set(-4, 0.3, 0);
  brickPile.castShadow = true;
  brickPile.receiveShadow = true;

  scene.add(brickPile);

  const brickItem = {
    object: brickPile,
    name: 'Pilha de tijolos',
    prompt: 'E — Pegar tijolos',
    onInteract: () => {
      console.log('Pegou:', brickItem.name);
      scene.remove(brickPile);
      interaction.unregister(brickItem);
    }
  };

  interaction.register(brickItem);

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
    const locked =
      document.pointerLockElement === renderer.domElement;

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

    // Acumula o tempo para a física
    accumulator += delta;

    // Simulação física em intervalos fixos
    while (accumulator >= fixedStep) {
      player.update(fixedStep);
      physics.step();
      accumulator -= fixedStep;
    }

    // Sincroniza o modelo visual após a física
    player.syncVisual();

    if (DEBUG && performance.now() % 500 < 16) {
      console.log('pos', player.getPosition(), 'keys', { ...player.keys });
    }

    // Posição atual do personagem
    const position = player.getPosition();

    cameraTarget.set(
      position.x,
      position.y + 0.8,
      position.z
    );

    const yaw = player.cameraYaw;
    const pitch = player.cameraPitch;

    cameraPosition.set(
      cameraTarget.x +
        Math.sin(yaw) * cameraDistance * Math.cos(pitch),

      cameraTarget.y +
        cameraDistance * Math.sin(pitch),

      cameraTarget.z +
        Math.cos(yaw) * cameraDistance * Math.cos(pitch)
    );

    camera.position.lerp(
      cameraPosition,
      1 - Math.pow(0.001, delta)
    );

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
