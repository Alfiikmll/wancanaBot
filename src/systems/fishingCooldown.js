const fishingCooldowns = new Map();

const COOLDOWN_TIME = 10 * 1000;

export function checkFishingCooldown(playerId) {
  const now = Date.now();

  const cooldownUntil =
    fishingCooldowns.get(playerId);

  if (cooldownUntil && cooldownUntil > now) {
    const remaining = Math.ceil(
      (cooldownUntil - now) / 1000,
    );

    return {
      allowed: false,
      remaining,
    };
  }

  return {
    allowed: true,
    remaining: 0,
  };
}

export function startFishingCooldown(playerId) {
  const now = Date.now();

  fishingCooldowns.set(
    playerId,
    now + COOLDOWN_TIME,
  );
}