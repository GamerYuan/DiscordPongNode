import { setupSdk } from "dissonity";

window.addEventListener("DOMContentLoaded", () => {

  setupSdk({
    clientId: 1/*your-app-id*/,
    scope: ["rpc.voice.read", "guilds.members.read"],
    tokenRoute: "/api/token"
  });
});