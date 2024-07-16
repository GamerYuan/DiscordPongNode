/**
 * You can add your Colyseus schemas in this file.
 * The Unity C# scripts will be generated inside _unity_colyseus
 * after running "npm run colyseus".
 */

import { Schema, type, MapSchema } from "@colyseus/schema";

export class Participant extends Schema {
  @type("string")
  userId: string = "";
}

// Example player schema, you could add more properties, a constructor...
export class Player extends Participant {
  @type("number")
  y: number = 0.0;
}

export class Spectator extends Participant {
  @type("number")
  x: number = 0.0;

  @type("number")
  y: number = 0.0;
}

export class Ball extends Schema {
  @type("number")
  x: number = 0.0;

  @type("number")
  y: number = 0.0;

  @type("boolean")
  isNewBall: boolean = true;

  @type("string")
  lastHitBy: string = "";
}

// Example game state
export class GameState extends Schema {
  @type({ map: Participant })
  participants = new MapSchema<Participant>();

  @type(Ball)
  ball = new Ball();

  @type({ map: "int32" })
  scoreboard = new MapSchema<number>();

  @type({ map: "string" })
  usernames = new MapSchema<string>();

  createPlayer(sessionId: string) {
    this.participants.set(sessionId, new Player());
    this.scoreboard.set(sessionId, 0);
  }

  removePlayer(sessionId: string) {
    this.participants.delete(sessionId);
  }

  addScore(sessionId: string) {
    this.scoreboard.set(sessionId, (this.scoreboard.get(sessionId) || 0) + 1);
  }
}
