/**
 * Here you can add your Colyseus rooms
 * (https://docs.colyseus.io/server/room/)
 */

import { Room } from "colyseus";
import { GameState, Player } from "./structures";

import type { Client } from "colyseus";
import type { ExpectedCreateOptions, ExpectedJoinOptions } from "./types";

// Used to keep track of existing rooms. The keys are activity instance ids.
const roomsMap = new Map<string, boolean>();

export type PositionMessage = {
    position: number
}

// This is your actual game room!
export class GameRoom extends Room {

    override onCreate(options: ExpectedCreateOptions): void | Promise<any> {
        
        //? Check validity
        if (typeof options.instanceId != "string") return this.disconnect();
        console.log(`Room with instance id ${options.instanceId} created`)

        roomsMap.set(options.instanceId, true);

        // Increasing the reservation time to increase flexibility with the client
        this.setSeatReservationTime(20);
        
        //\ Set id and state
        this.roomId = options.instanceId;
        this.setState(new GameState());


        // You can set up your listeners here
        this.onMessage("playerPosition", (client, position: PositionMessage) => {
            const player = this.state.players.get(client.sessionId);
            player.y = position;
            console.log({position});
        })
    }

    override onJoin(client: Client, options?: ExpectedJoinOptions): void | Promise<any> {

        //? Check validity
        if (typeof options?.userId != "string") return client.leave();

        console.log(`Client joined to room with instance id: ${this.roomId}`);
        client.send("welcomeMessage", "Welcome!");

        //\ Set user id to player
        const player = new Player();
        player.userId = options.userId;

        //\ Save player to state (for other clients to receive it)
        const state = this.state as GameState;
        state.players.set(client.sessionId, player);
    }

    override async onLeave(client: Client, consented?: boolean | undefined): Promise<any> {

        const state = this.state as GameState;
        
        // Mark player as disconnected
        state.players.get(client.sessionId)!.connected = false;

        try {
            if (consented) {
                throw new Error("Consented disconnect");
            }

            // Client has 5 seconds to reconnect
            await this.allowReconnection(client, 5);

            // Client's saved
            state.players.get(client.sessionId)!.connected = true;

        } catch (err) {

            console.log(`Client left room with instance id: ${this.roomId}`);

            // Client will be removed
            state.players.delete(client.sessionId);
        }
    }

    override onDispose(): void | Promise<any> {

        console.log(`Room with instance id ${this.roomId} disposed\n`);

        roomsMap.delete(this.roomId);
    }
}