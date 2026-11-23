import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export class Player {
  body: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  controller: RAPIER.KinematicCharacterController;

  visual: THREE.Group;

  keys: Record<string, boolean> = {};

  cameraYaw = 0;
  cameraPitch = 0.28;

  // false = comportamento original (-=). Mude para true para inverter o eixo.
  invertX = false;
  invertY = false;

  speed = 5;
  sprintSpeed = 8;
  jumpSpeed = 6;
  gravity = -20;

  verticalVelocity = 0;
  grounded = false;
  jumpRequested = false;

  constructor(
    scene: THREE.Scene,
    physics: RAPIER.World
  ) {
    // Corpo cinemático: movido pelo controller, não pela gravidade do Rapier
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(0, 1.2, 6);

    this.body = physics.createRigidBody(bodyDesc);

    this.collider = physics.createCollider(
      RAPIER.ColliderDesc.capsule(0.48, 0.30),
      this.body
    );

    // Controller de personagem
    this.controller = physics.createCharacterController(0.01);
    this.controller.setUp({ x: 0, y: 1, z: 0 });
    this.controller.enableAutostep(0.4, 0.2, true);
    this.controller.enableSnapToGround(0.3);
    this.controller.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    this.controller.setMinSlopeSlideAngle((60 * Math.PI) / 180);

    // Modelo visual
    this.visual = new THREE.Group();

    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.85, 5, 10),
      new THREE.MeshStandardMaterial({
        color: 0xe47732,
        roughness: 0.9
      })
    );

    torso.position.y = 0.05;
    torso.castShadow = true;

    this.visual.add(torso);

    // Cabeça
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0xc99470,
        roughness: 0.9
      })
    );

    head.position.y = 0.76;
    head.castShadow = true;

    this.visual.add(head);

    // Capacete de segurança
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.27,
        16,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      ),
      new THREE.MeshStandardMaterial({
        color: 0xf5cf24,
        roughness: 0.65
      })
    );

    helmet.position.y = 0.93;
    helmet.castShadow = true;

    this.visual.add(helmet);

    // Aba do capacete
    const visor = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.29,
        0.29,
        0.035,
        20
      ),
      new THREE.MeshStandardMaterial({
        color: 0xe8bd18
      })
    );

    visor.position.y = 0.87;
    this.visual.add(visor);

    scene.add(this.visual);

    // Teclado
    window.addEventListener('keydown', (event) => {
      this.keys[event.code] = true;

      if (
        event.code === 'Space' &&
        !event.repeat
      ) {
        this.jumpRequested = true;
        event.preventDefault();
      }
    });

    window.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.jumpRequested = false;
    });

    this.syncVisual();
  }

  handleMouseMove(event: MouseEvent) {
    if (document.pointerLockElement === null) return;

    this.cameraYaw +=
      event.movementX * 0.0025 * (this.invertX ? 1 : -1);

    this.cameraPitch -=
      event.movementY * 0.002 * (this.invertY ? 1 : -1);

    this.cameraPitch = THREE.MathUtils.clamp(
      this.cameraPitch,
      -0.15,
      1.0
    );
  }

  // Chamado uma vez por passo fixo de física (antes do physics.step())
  update(dt: number) {
    const forward =
      (this.keys['KeyW'] ? 1 : 0) - (this.keys['KeyS'] ? 1 : 0);

    const sideways =
      (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);

    const sin = Math.sin(this.cameraYaw);
    const cos = Math.cos(this.cameraYaw);

    const direction = new THREE.Vector3(
      -sin * forward + cos * sideways,
      0,
      -cos * forward - sin * sideways
    );

    if (direction.lengthSq() > 0) {
      direction.normalize();
    }

    const sprinting =
      this.keys['ShiftLeft'] || this.keys['ShiftRight'];

    const currentSpeed = sprinting ? this.sprintSpeed : this.speed;

    // Gravidade e pulo
    if (this.grounded && this.verticalVelocity < 0) {
      this.verticalVelocity = 0;
    }

    if (this.jumpRequested && this.grounded) {
      this.verticalVelocity = this.jumpSpeed;
    }

    this.jumpRequested = false;

    this.verticalVelocity += this.gravity * dt;

    // Movimento desejado neste passo
    const desired = {
      x: direction.x * currentSpeed * dt,
      y: this.verticalVelocity * dt,
      z: direction.z * currentSpeed * dt
    };

    this.controller.computeColliderMovement(this.collider, desired);

    const move = this.controller.computedMovement();
    this.grounded = this.controller.computedGrounded();

    const p = this.body.translation();

    this.body.setNextKinematicTranslation({
      x: p.x + move.x,
      y: p.y + move.y,
      z: p.z + move.z
    });

    // Rotação do modelo
    if (direction.lengthSq() > 0.01) {
      this.visual.rotation.y = Math.atan2(direction.x, direction.z);
    }
  }

  syncVisual() {
    const position = this.body.translation();

    this.visual.position.set(
      position.x,
      position.y,
      position.z
    );
  }

  getPosition(): THREE.Vector3 {
    const position = this.body.translation();

    return new THREE.Vector3(
      position.x,
      position.y,
      position.z
    );
  }
}
