
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export function createWorld(
  scene: THREE.Scene,
  physics: RAPIER.World
) {
  // Céu
  scene.background = new THREE.Color(0xb8d7eb);
  scene.fog = new THREE.Fog(0xb8d7eb, 55, 190);

  // Iluminação ambiente
  const ambient = new THREE.HemisphereLight(
    0xffffff,
    0x64734c,
    2.0
  );

  scene.add(ambient);

  // Sol
  const sun = new THREE.DirectionalLight(
    0xffe5bc,
    3.0
  );

  sun.position.set(-35, 65, 30);
  sun.castShadow = true;

  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.normalBias = 0.03;

  scene.add(sun);

  // Terreno
  const groundGeometry = new THREE.PlaneGeometry(240, 240);

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x66834b,
    roughness: 1
  });

  const ground = new THREE.Mesh(
    groundGeometry,
    groundMaterial
  );

  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  scene.add(ground);

  // Área de construção
  const constructionArea = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 20),
    new THREE.MeshStandardMaterial({
      color: 0x98734c,
      roughness: 1
    })
  );

  constructionArea.rotation.x = -Math.PI / 2;
  constructionArea.position.set(-12, 0.015, -8);
  constructionArea.receiveShadow = true;

  scene.add(constructionArea);

  // Estrada de terra
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 150),
    new THREE.MeshStandardMaterial({
      color: 0x88745a,
      roughness: 1
    })
  );

  road.rotation.x = -Math.PI / 2;
  road.position.set(28, 0.02, 0);

  scene.add(road);

  // Árvores
  function createTree(x: number, z: number) {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 2.5, 8),
      new THREE.MeshStandardMaterial({
        color: 0x654329,
        roughness: 1
      })
    );

    trunk.position.y = 1.25;
    trunk.castShadow = true;

    group.add(trunk);

    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 10, 8),
      new THREE.MeshStandardMaterial({
        color: 0x426b37,
        roughness: 1
      })
    );

    foliage.position.y = 3.1;
    foliage.scale.set(1, 1.2, 1);

    foliage.castShadow = true;

    group.add(foliage);

    group.position.set(x, 0, z);

    scene.add(group);

    // Colisão do tronco
    const body = physics.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(x, 1.25, z)
    );

    physics.createCollider(
      RAPIER.ColliderDesc.cuboid(0.3, 1.25, 0.3),
      body
    );
  }

  const trees = [
    [-18, -22],
    [-25, -10],
    [-20, 8],
    [-35, 18],
    [-10, 30],
    [5, -28],
    [15, -18],
    [40, -25],
    [42, 5],
    [38, 28],
    [-40, -35],
    [-45, 5]
  ];

  trees.forEach(([x, z]) => createTree(x, z));

  // Pedras decorativas
  for (let i = 0; i < 18; i++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(
        0.25 + Math.random() * 0.45,
        0
      ),
      new THREE.MeshStandardMaterial({
        color: 0x77766c,
        roughness: 1
      })
    );

    rock.position.set(
      -45 + Math.random() * 90,
      0.25,
      -45 + Math.random() * 90
    );

    rock.rotation.set(
      Math.random(),
      Math.random(),
      Math.random()
    );

    rock.castShadow = true;
    rock.receiveShadow = true;

    scene.add(rock);
  }
}
