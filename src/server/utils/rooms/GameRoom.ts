/**
 * Here you can add your Colyseus rooms
 * (https://docs.colyseus.io/server/room/)
 */

import { Room } from "colyseus";
import { GameState, Participant, Player } from "../structures";

import type { Client } from "colyseus";
import type { ExpectedCreateOptions, ExpectedJoinOptions } from "../types";

// Used to keep track of existing rooms. The keys are activity instance ids.
const roomsMap = new Map<string, boolean>();

export type PlayerPositionMessage = {
  position: number;
};

export type SpectatorCubePositionMessage = {
  x: number;
  y: number;
};

// This is your actual game room!
export class GameRoom extends Room {
  override onCreate(options: ExpectedCreateOptions): void | Promise<any> {
    //? Check validity
    if (typeof options.instanceId != "string") return this.disconnect();
    roomsMap.set(options.instanceId, true);

    this.roomId = options.instanceId;
    // Increasing the reservation time to increase flexibility with the client
    this.setSeatReservationTime(20);

    //\ Set id and state
    console.log(`Room with room id ${this.roomId} created`);

    this.setState(new GameState());

    // You can set up your listeners here
    this.onMessage(
      "playerPosition",
      (client, position: PlayerPositionMessage) => {
        const player = this.state.participants.get(client.sessionId);
        player.y = position;
        console.log(client.sessionId + " " + player.y);
      }
    );

    this.onMessage(
      "spectatorCubePosition",
      (client, position: SpectatorCubePositionMessage) => {
        const spectator = this.state.participants.get(client.sessionId);
        spectator.x = position.x;
        spectator.y = position.y;
        console.log(client.sessionId + " " + position.x + " " + position.y);
      }
    );
  }

  override onJoin(
    client: Client,
    options?: ExpectedJoinOptions
  ): void | Promise<any> {
    //? Check validity
    if (typeof options?.userId != "string") return client.leave();

    console.log(
      `User ${options.userId} joined to room with room id: ${this.roomId}`
    );
    client.send("welcomeMessage", "Welcome!");

    let participant: Participant = new Participant();
    const state = this.state as GameState;

    if (state.participants.size <= 2) {
      console.log("Creating player");
      participant = new Player();
    }

    if (!participant) return client.leave();

    participant.userId = options.userId;

    //\ Save player to state (for other clients to receive it)
    state.participants.set(client.sessionId, participant);
    console.log(
      `Participant ${client.sessionId} added to room state with room id: ${this.roomId}`
    );
  }

  override async onLeave(
    client: Client,
    consented?: boolean | undefined
  ): Promise<any> {
    const state = this.state as GameState;

    console.log(`Client left room with instance id: ${this.roomId}`);

    // Client will be removed
    state.participants.delete(client.sessionId);
  }

  override onDispose(): void | Promise<any> {
    console.log(`Room with instance id ${this.roomId} disposed\n`);

    roomsMap.delete(this.roomId);
  }
}
