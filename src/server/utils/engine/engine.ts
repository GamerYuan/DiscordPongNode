import Matter, { Bodies } from "matter-js";
import { GameState, Player } from "../structures";

export class GameEngine {
  engine: Matter.Engine;
  world: Matter.World;
  state: GameState;

  players: Map<string, Matter.Body> = new Map();

  readonly playerSpeed: number = 2.5;

  constructor(state: GameState) {
    this.state = state;

    this.engine = Matter.Engine.create();
    this.engine.gravity.scale = 0;
    this.world = this.engine.world;
    this.init();
  }

  init() {
    const topWall = Bodies.rectangle(0, 50, 10, 10, {
      isStatic: true,
    });
    const bottomWall = Bodies.rectangle(0, -50, 10, 10, {
      isStatic: true,
    });

    Matter.Body.scale(topWall, 25, 0.25);
    Matter.Body.scale(bottomWall, 25, 0.25);

    const leftDeadZone = Bodies.rectangle(-100, 0, 10, 10, {
      isStatic: true,
    });
    const rightDeadZone = Bodies.rectangle(100, 0, 10, 10, {
      isStatic: true,
    });

    Matter.Body.scale(leftDeadZone, 1, 10);
    Matter.Body.scale(rightDeadZone, 1, 10);

    Matter.Composite.add(this.world, [
      topWall,
      bottomWall,
      leftDeadZone,
      rightDeadZone,
    ]);

    this.initUpdateEvents();
    this.initCollisionEvents();
  }

  initUpdateEvents() {
    //const detector = Matter.Detector.create({ bodies: this.world.bodies });

    Matter.Events.on(this.engine, "afterUpdate", () => {
      this.players.forEach((player, key) => {
        if (!this.state.participants.get(key) || !player) return;

        (this.state.participants.get(key) as Player).y = player.position.y;
      });

      //const collision = Matter.Detector.collisions(detector);
      // if (collision.length > 0) {
      //   console.log("Collision detected!");
      // }
    });
  }

  initCollisionEvents() {
    // The collision events
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      const pairs = event.pairs;
    });
  }

  addPlayer(sessionId: string, playerNumber: number) {
    const startX = playerNumber === 0 ? -70 : 70;
    const player = Bodies.rectangle(startX, 0, 10, 10);

    player.frictionAir = 1;

    Matter.Body.scale(player, 0.35, 2);

    this.players.set(sessionId, player);

    Matter.Composite.add(this.world, [player]);

    this.state.createPlayer(sessionId);
  }

  removePlayer(sessionId: string) {
    const player = this.players.get(sessionId);
    if (player) {
      Matter.Composite.remove(this.world, player);
      this.players.delete(sessionId);
      this.state.removePlayer(sessionId);
    }
  }

  processPlayerInput(sessionId: string, direction: number) {
    if (direction !== 1 && direction !== -1) return;
    const player = this.players.get(sessionId);
    if (!player) return;

    Matter.Body.setVelocity(player, {
      x: 0,
      y: direction * this.playerSpeed,
    });
    console.log(player.position.y);
  }
}
