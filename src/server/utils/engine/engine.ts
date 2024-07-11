import Matter, { Bodies } from "matter-js";
import { GameState, Player } from "../structures";

export class GameEngine {
  engine: Matter.Engine;
  world: Matter.World;
  state: GameState;

  players: Map<string, Matter.Body> = new Map();

  readonly playerStep: number = 0.1;

  constructor(state: GameState) {
    this.state = state;

    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.init();
  }

  init() {
    const topWall = Bodies.rectangle(0, 5, 1, 1, {
      isStatic: true,
      isSensor: true,
    });
    const bottomWall = Bodies.rectangle(0, -5, 1, 1, {
      isStatic: true,
      isSensor: true,
    });

    Matter.Body.scale(topWall, 25, 0.25);
    Matter.Body.scale(bottomWall, 25, 0.25);

    const leftDeadZone = Bodies.rectangle(-10, 0, 1, 1, {
      isStatic: true,
      isSensor: true,
    });
    const rightDeadZone = Bodies.rectangle(10, 0, 1, 1, {
      isStatic: true,
      isSensor: true,
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
  }

  initUpdateEvents() {
    const detector = Matter.Detector.create({ bodies: this.world.bodies });
    console.log(detector.bodies);

    Matter.Events.on(this.engine, "afterUpdate", () => {
      this.players.forEach((player, key) => {
        if (!this.state.participants.get(key) || !player) return;

        (this.state.participants.get(key) as Player).y = player.position.y;
      });

      const collision = Matter.Detector.collisions(detector);
      if (collision.length > 0) {
        console.log("Collision detected", collision);
        console.log(collision[0].bodyA.position);
      }
    });
  }

  addPlayer(sessionId: string, playerNumber: number) {
    const startX = playerNumber === 0 ? -7 : 7;
    const player = Bodies.rectangle(startX, 0, 1, 1, {
      isStatic: false,
      isSensor: true,
    });
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

    Matter.Body.setPosition(player, {
      x: player.position.x,
      y: player.position.y + direction * this.playerStep,
    });
  }
}
