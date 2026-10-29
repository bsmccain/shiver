import { registerGMOperation } from "./socket.mjs";

/**
 * Actor operations a player may need the GM to perform on actors they don't own.
 */
export function registerActorOperations() {
  const actor = async uuid => {
    const a = await fromUuid(uuid);
    if ( !a ) throw new Error(`No actor ${uuid}`);
    return a;
  };
  registerGMOperation("applyStatus", async ({ uuid, id, ...options }) => {
    const a = await actor(uuid);
    await a.applyStatus(id, options);
    return true;
  });
  registerGMOperation("removeStatus", async ({ uuid, id }) => (await actor(uuid)).removeStatus(id).then(() => true));
  registerGMOperation("setFear", async ({ uuid, level }) => (await actor(uuid)).setFearLevel(level).then(() => true));
  registerGMOperation("heal", async ({ uuid, amount, chat, source }) => (await actor(uuid)).heal(amount, { chat, source }));
  registerGMOperation("updateActor", async ({ uuid, changes, options }) => {
    await (await actor(uuid)).update(changes, options ?? {});
    return true;
  });
}
