
const activeBuffs = new Map();

function getPlayerBuffs(playerId) {
  if (!activeBuffs.has(playerId)) {
    activeBuffs.set(playerId, {});
  }

  return activeBuffs.get(playerId);
}

export function activateBuff(
  playerId,
  buffType,
  value,
  durationSeconds,
) {
  const buffs = getPlayerBuffs(playerId);

  const expiresAt =
    Date.now() +
    durationSeconds * 1000;

  buffs[buffType] = {
    value,
    expiresAt,
  };

  return {
    success: true,
    buff: buffs[buffType],
  };
}

export function getActiveBuff(
  playerId,
  buffType,
) {
  const buffs = activeBuffs.get(playerId);

  if (!buffs || !buffs[buffType]) {
    return null;
  }

  const buff = buffs[buffType];

  if (Date.now() >= buff.expiresAt) {
    delete buffs[buffType];
    return null;
  }

  return {
    ...buff,
    remainingSeconds: Math.ceil(
      (buff.expiresAt - Date.now()) / 1000,
    ),
  };
}

export function getGoldMultiplier(playerId) {
  const buff = getActiveBuff(
    playerId,
    "gold_boost",
  );

  if (!buff) {
    return 1;
  }

  return 1 + buff.value;
}

export function getLuckBonus(playerId) {
  const buff = getActiveBuff(
    playerId,
    "luck",
  );

  if (!buff) {
    return 0;
  }

  return buff.value;
}

export function getAllActiveBuffs(playerId) {
  const buffs = activeBuffs.get(playerId);

  if (!buffs) {
    return [];
  }

  const result = [];

  for (const buffType of Object.keys(buffs)) {
    const buff =
      getActiveBuff(
        playerId,
        buffType,
      );

    if (buff) {
      result.push({
        type: buffType,
        ...buff,
      });
    }
  }

  return result;
}
