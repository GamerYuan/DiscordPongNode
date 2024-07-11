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

// Example game state
export class GameState extends Schema {
  @type({ map: Participant })
  participants = new MapSchema<Participant>();

  createPlayer(sessionId: string) {
    this.participants.set(sessionId, new Player());
  }

  removePlayer(sessionId: string) {
    this.participants.delete(sessionId);
  }
}
