
import RAPIER from '@dimforge/rapier3d-compat';

export function createPhysicsWorld(): RAPIER.World {
  const gravity = { x: 0, y: -9.81, z: 0 };

  const world = new RAPIER.World(gravity);

  world.timestep = 1 / 60;

  // Chão físico
  const groundBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed()
      .setTranslation(0, -0.25, 0)
  );

  world.createCollider(
    RAPIER.ColliderDesc.cuboid(120, 0.25, 120)
      .setFriction(0.9),
    groundBody
  );

  return world;
}
