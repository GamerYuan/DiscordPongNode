import Matter, { Bodies } from "matter-js";
import { Ball, GameState, Player } from "../structures";

export class GameEngine {
  engine: Matter.Engine;
  world: Matter.World;
  state: GameState;

  players: Map<string, Matter.Body> = new Map();
  playerSession: Map<string, string> = new Map();
  ball: Matter.Body | null = null;
  isNewBall: boolean = true;
  deadzoneDetector: Matter.Detector = Matter.Detector.create();
  playerDetector: Matter.Detector = Matter.Detector.create();

  readonly playerSpeed: number = 18;
  readonly maxBallSpeed: number = 12;

  constructor(state: GameState) {
    this.state = state;

    this.engine = Matter.Engine.create();
    this.engine.gravity.scale = 0;
    this.world = this.engine.world;
    this.init();
  }

  init() {
    const topWall = Bodies.rectangle(0, 500, 100, 100, {
      isStatic: true,
      restitution: 1,
    });
    const bottomWall = Bodies.rectangle(0, -500, 100, 100, {
      isStatic: true,
      restitution: 1,
    });

    Matter.Body.scale(topWall, 25, 0.25);
    Matter.Body.scale(bottomWall, 25, 0.25);

    const leftDeadZone = Bodies.rectangle(-1000, 0, 100, 100, {
      isStatic: true,
      isSensor: true,
      label: "leftDeadZone",
    });
    const rightDeadZone = Bodies.rectangle(1000, 0, 100, 100, {
      isStatic: true,
      isSensor: true,
      label: "rightDeadZone",
    });

    Matter.Body.scale(leftDeadZone, 1, 10);
    Matter.Body.scale(rightDeadZone, 1, 10);

    this.deadzoneDetector.bodies.push(leftDeadZone);
    this.deadzoneDetector.bodies.push(rightDeadZone);

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

      if (this.ball && this.state.ball) {
        this.handleBallUpdate();
        this.handleBallCollisions();
      }

      if (this.playerSession.has("Player0")) {
        const player0 = this.players.get(this.playerSession.get("Player0")!);
        Matter.Body.setPosition(player0!, { x: -700, y: player0!.position.y });
      }

      if (this.playerSession.has("Player1")) {
        const player1 = this.players.get(this.playerSession.get("Player1")!);
        Matter.Body.setPosition(player1!, { x: 700, y: player1!.position.y });
      }
    });
  }

  initCollisionEvents() {
    // The collision events
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      const pairs = event.pairs;
    });
  }

  addPlayer(sessionId: string, playerNumber: number) {
    const startX = playerNumber === 0 ? -700 : 700;
    const player = Bodies.rectangle(startX, 0, 100, 100, {
      friction: 1,
      frictionAir: 1,
      inertia: Infinity,
      restitution: 1,
      label: sessionId,
    });

    Matter.Body.scale(player, 0.35, 2);

    this.players.set(sessionId, player);
    this.playerSession.set(`Player${playerNumber}`, sessionId);

    Matter.Composite.add(this.world, [player]);

    this.state.createPlayer(sessionId);
    this.playerDetector.bodies.push(player);
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
  }

  spawnBall() {
    const ball = Bodies.circle(0, 0, 50, { restitution: 1, inertia: Infinity });

    ball.friction = 0;
    ball.frictionAir = 0;
    ball.frictionStatic = 0;

    this.ball = ball;

    Matter.Composite.add(this.world, [ball]);

    this.state.ball.x = ball.position.x;
    this.state.ball.y = ball.position.y;

    this.deadzoneDetector.bodies.push(ball);
    this.playerDetector.bodies.push(ball);
  }

  handleBallUpdate() {
    this.state.ball.x = this.ball!.position.x;
    this.state.ball.y = this.ball!.position.y;

    if (this.isNewBall) {
      this.isNewBall = false;

      const randomDirectionX = Math.random() > 0.5 ? 1 : -1;
      const randomDirectionY = Math.random() > 0.5 ? 1 : -1;

      Matter.Body.setVelocity(
        this.ball!,
        Matter.Vector.mult(
          Matter.Vector.normalise({
            x: Math.random() * randomDirectionX,
            y: Math.random() * randomDirectionY,
          }),
          this.maxBallSpeed
        )
      );
      this.state.ball.lastHitBy = "";
    } else {
      Matter.Body.setVelocity(
        this.ball!,
        Matter.Vector.mult(
          Matter.Vector.normalise(this.ball!.velocity),
          this.maxBallSpeed
        )
      );
    }
  }

  handleBallCollisions() {
    const deadzoneCollision = Matter.Detector.collisions(this.deadzoneDetector);
    if (deadzoneCollision.length > 0) {
      this.isNewBall = true;

      if (
        deadzoneCollision[0].bodyA.label === "leftDeadZone" ||
        deadzoneCollision[0].bodyB.label === "leftDeadZone"
      ) {
        const session = this.playerSession.get("Player1");
        this.state.scoreboard.set(
          session!,
          (this.state.scoreboard.get(session!) ?? 0) + 1
        );
        console.log(this.state.scoreboard.get(session!));
      }

      if (
        deadzoneCollision[0].bodyA.label === "rightDeadZone" ||
        deadzoneCollision[0].bodyB.label === "rightDeadZone"
      ) {
        const session = this.playerSession.get("Player0");
        this.state.scoreboard.set(
          session!,
          (this.state.scoreboard.get(session!) ?? 0) + 1
        );
        console.log(this.state.scoreboard.get(session!));
      }

      Matter.Body.setPosition(this.ball!, {
        x: 0,
        y: 0,
      });
    }

    const playerCollision = Matter.Detector.collisions(this.playerDetector);
    if (playerCollision.length > 0) {
      this.state.ball.lastHitBy = this.players.has(
        playerCollision[0].bodyA.label
      )
        ? playerCollision[0].bodyA.label
        : playerCollision[0].bodyB.label;
    }
  }
}
