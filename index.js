import { setupSdk } from "dissonity";

window.addEventListener("DOMContentLoaded", () => {

  setupSdk({
    clientId: process.env.CLIENT_ID /*your-app-id*/,
    scope: ["rpc.voice.read", "guilds.members.read"],
    tokenRoute: "/api/token"
  });
});