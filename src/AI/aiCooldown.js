const userLimits = new Map();

const MAX_QUESTIONS = 5;
const COOLDOWN_TIME = 60 * 1000;

export function checkAICooldown(userId) {
  const now = Date.now();
  const userData = userLimits.get(userId);

  // User belum pernah bertanya
  if (!userData) {
    userLimits.set(userId, {
      count: 1,
      cooldownUntil: 0,
    });

    return {
      allowed: true,
      count: 1,
      remaining: 0,
    };
  }

  // Jika user masih dalam cooldown
  if (userData.cooldownUntil > now) {
    const remaining = Math.ceil(
      (userData.cooldownUntil - now) / 1000,
    );

    return {
      allowed: false,
      count: userData.count,
      remaining,
    };
  }

  // Jika cooldown sudah selesai, reset hitungan
  if (userData.cooldownUntil !== 0) {
    userLimits.set(userId, {
      count: 1,
      cooldownUntil: 0,
    });

    return {
      allowed: true,
      count: 1,
      remaining: 0,
    };
  }

  // User masih punya sisa pertanyaan
  if (userData.count < MAX_QUESTIONS) {
    userData.count += 1;

    return {
      allowed: true,
      count: userData.count,
      remaining: 0,
    };
  }

  // Sudah mencapai 5 pertanyaan
  userData.cooldownUntil = now + COOLDOWN_TIME;

  return {
    allowed: false,
    count: userData.count,
    remaining: 60,
  };
}