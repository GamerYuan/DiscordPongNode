import Matter, { Bodies } from "matter-js";
import { GameState, Player } from "../structures";

export class GameEngine {
  engine: Matter.Engine;
  world: Matter.World;
  state: GameState;

  players: Map<string, Matter.Body> = new Map();

  readonly playerSpeed: number = 0.1;

  constructor(state: GameState) {
    this.state = state;

    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.init();
  }

  init() {
    const topWall = Bodies.rectangle(0, 5, 1, 1, { isStatic: true });
    const bottomWall = Bodies.rectangle(0, -5, 1, 1, { isStatic: true });

    Matter.Body.scale(topWall, 25, 0.25);
    Matter.Body.scale(bottomWall, 25, 0.25);

    const leftDeadZone = Bodies.rectangle(-10, 0, 1, 1, { isStatic: true });
    const rightDeadZone = Bodies.rectangle(10, 0, 1, 1, { isStatic: true });

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
    Matter.Events.on(this.engine, "afterUpdate", () => {
      for (const key in this.players) {
        if (this.state.participants.get(key) || this.players.get(key)) {
          (this.state.participants.get(key) as Player).y =
            this.players.get(key)!.position.y;
        }
      }
    });
  }

  initCollisionEvents() {
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      console.log("collisionStart", event);
      const pairs = event.pairs;
    });
  }

  addPlayer(sessionId: string, playerNumber: number) {
    const startX = playerNumber === 0 ? -7 : 7;
    const player = Bodies.rectangle(startX, 0, 1, 1, {
      label: `player${playerNumber}`,
    });
    Matter.Body.scale(player, 0.35, 2);

    this.players.set(sessionId, player);

    Matter.Composite.add(this.world, [player]);

    // state create
  }

  removePlayer(sessionId: string) {
    const player = this.players.get(sessionId);
    if (player) {
      Matter.Composite.remove(this.world, player);
      this.players.delete(sessionId);
    }
  }

  processPlayerInput(sessionId: string, direction: number) {
    if (direction !== 1 && direction !== -1) return;
    const player = this.players.get(sessionId);
    if (!player) return;

    Matter.Body.setVelocity(player, { x: 0, y: direction * this.playerSpeed });
  }
}
