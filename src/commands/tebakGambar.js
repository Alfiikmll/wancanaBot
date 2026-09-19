import pool from "../databases/database.js";
import fs from "node:fs";
import path from "node:path";

const GAME_DURATION_SECONDS = 60;

const FIRST_PLACE_POINTS = 100;
const HINT_1_POINTS = 75;
const HINT_2_POINTS = 50;
const HINT_3_POINTS = 25;

const WIN_GOLD_REWARD = 50;

const gameTimers = new Map();

function normalizeAnswer(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAliases(aliases) {
  if (!aliases) return [];

  try {
    const parsed = JSON.parse(aliases);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {}

  return String(aliases)
    .split(/[,|\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAcceptedAnswers(question) {
  return [question.answer, ...parseAliases(question.aliases)]
    .map(normalizeAnswer)
    .filter(Boolean);
}

function checkAnswer(userAnswer, question) {
  const normalized = normalizeAnswer(userAnswer);

  if (!normalized) {
    return false;
  }

  return getAcceptedAnswers(question).includes(normalized);
}

function getPointsByStage(stage) {
  if (stage === 0) return FIRST_PLACE_POINTS;
  if (stage === 1) return HINT_1_POINTS;
  if (stage === 2) return HINT_2_POINTS;
  return HINT_3_POINTS;
}

function clearGameTimer(groupId) {
  const timer = gameTimers.get(groupId);

  if (timer) {
    clearTimeout(timer);
    gameTimers.delete(groupId);
  }
}

function resolveImagePath(imagePath) {
  if (!imagePath) {
    return null;
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  if (path.isAbsolute(imagePath)) {
    return imagePath;
  }

  return path.resolve(process.cwd(), imagePath);
}

function getImageContent(imagePath) {
  const resolvedPath = resolveImagePath(imagePath);

  if (!resolvedPath) {
    return null;
  }

  if (/^https?:\/\//i.test(resolvedPath)) {
    return { url: resolvedPath };
  }

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  return fs.readFileSync(resolvedPath);
}

async function getPlayerByWhatsappId(whatsappId) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      whatsapp_id,
      name,
      gold
    FROM players
    WHERE whatsapp_id = ?
    LIMIT 1
    `,
    [whatsappId],
  );

  return rows[0] || null;
}

async function cleanupExpiredGames() {
  await pool.query(
    `
    UPDATE active_guess_games
    SET
      status = 'expired',
      finished_at = NOW()
    WHERE status = 'active'
      AND started_at <= NOW() - INTERVAL 60 SECOND
    `,
  );
}

async function getActiveGame(groupId) {
  await cleanupExpiredGames();

  const [rows] = await pool.query(
    `
    SELECT
      g.id,
      g.group_id,
      g.question_id,
      g.started_at,
      g.current_stage,
      g.status,
      g.winner_player_id,

      q.image_path,
      q.shadow_image_path,
      q.answer,
      q.aliases,
      q.clue1,
      q.clue2,
      q.clue3

    FROM active_guess_games g

    INNER JOIN fishing_questions q
      ON q.id = g.question_id

    WHERE g.group_id = ?
      AND g.status = 'active'

    ORDER BY g.id DESC
    LIMIT 1
    `,
    [groupId],
  );

  return rows[0] || null;
}

async function markGameExpired(gameId) {
  const [result] = await pool.query(
    `
    UPDATE active_guess_games
    SET
      status = 'expired',
      finished_at = NOW()
    WHERE id = ?
      AND status = 'active'
    `,
    [gameId],
  );

  return result.affectedRows;
}

function scheduleGameExpiry(sock, groupId, gameId) {
  clearGameTimer(groupId);

  const timer = setTimeout(
    async () => {
      gameTimers.delete(groupId);

      try {
        const result = await finishExpiredGame(gameId);

        if (result.success && result.finished) {
          await sock.sendMessage(groupId, {
            text: result.message,
          });
        }
      } catch (error) {
        console.error(
          "Guess auto expire error:",
          error,
        );
      }
    },
    GAME_DURATION_SECONDS * 1000,
  );

  gameTimers.set(groupId, timer);
}

async function startGame(sock, groupId, userId) {
  if (!groupId?.endsWith("@g.us")) {
    return {
      success: false,
      message:
        "❌ Tebak Gambar hanya bisa dimainkan di grup.",
    };
  }

  const player = await getPlayerByWhatsappId(userId);

  if (!player) {
    return {
      success: false,
      message:
        "❌ Kamu belum terdaftar.\n\n" +
        "Gunakan:\n" +
        "/daftar NamaKamu",
    };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [activeGames] = await connection.query(
      `
      SELECT id
      FROM active_guess_games
      WHERE group_id = ?
        AND status = 'active'
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
      `,
      [groupId],
    );

    if (activeGames.length > 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "🎯 Masih ada Tebak Gambar yang sedang berlangsung di grup ini.",
      };
    }

    const [questions] = await connection.query(
      `
      SELECT
        id,
        image_path,
        shadow_image_path,
        answer,
        aliases,
        clue1,
        clue2,
        clue3
      FROM fishing_questions
      WHERE is_active = 1
        AND shadow_image_path IS NOT NULL
        AND shadow_image_path <> ''
      ORDER BY RAND()
      LIMIT 1
      `,
    );

    if (questions.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message:
          "❌ Belum ada soal Tebak Gambar yang memiliki gambar shadow di database.",
      };
    }

    const question = questions[0];

    const [insertResult] = await connection.query(
      `
      INSERT INTO active_guess_games
      (
        group_id,
        question_id,
        started_at,
        current_stage,
        status
      )
      VALUES
      (?, ?, NOW(), 0, 'active')
      `,
      [groupId, question.id],
    );

    const gameId = insertResult.insertId;

    await connection.commit();

    const shadowContent = getImageContent(
      question.shadow_image_path,
    );

    const originalPath = resolveImagePath(
      question.image_path,
    );

    if (!shadowContent) {
      await markGameExpired(gameId);

      return {
        success: false,
        message:
          "❌ Gambar shadow tidak ditemukan:\n" +
          question.shadow_image_path,
      };
    }

    if (!originalPath) {
      await markGameExpired(gameId);

      return {
        success: false,
        message:
          "❌ Path gambar asli pada soal kosong.",
      };
    }

    if (
      !/^https?:\/\//i.test(originalPath) &&
      !fs.existsSync(originalPath)
    ) {
      await markGameExpired(gameId);

      return {
        success: false,
        message:
          "❌ File gambar asli tidak ditemukan:\n" +
          originalPath,
      };
    }

    scheduleGameExpiry(
      sock,
      groupId,
      gameId,
    );

    await sock.sendMessage(groupId, {
      image: shadowContent,
      caption:
        "🖼️ *TEBAK GAMBAR DIMULAI!*\n\n" +
        "🌑 Gambar di atas masih dalam mode *8-BIT SHADOW*.\n" +
        "👀 Coba tebak siapa/orang apa yang ada di gambar!\n\n" +
        "⏱️ Waktu: 60 detik\n\n" +
        `🏆 Tanpa petunjuk: ${FIRST_PLACE_POINTS} poin\n` +
        `💡 Petunjuk 1: ${HINT_1_POINTS} poin\n` +
        `💡 Petunjuk 2: ${HINT_2_POINTS} poin\n` +
        `💡 Petunjuk 3: ${HINT_3_POINTS} poin\n` +
        `💰 Pemenang: +${WIN_GOLD_REWARD} Gold\n\n` +
        "Untuk meminta petunjuk:\n" +
        "/tebakgambar petunjuk\n\n" +
        "🏆 Leaderboard:\n" +
        "/tebakgambar skor",
    });

    return {
      success: true,
      message:
        "🎯 Tebak Gambar berhasil dimulai.",
      gameId,
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    console.error(
      "Start guess game error:",
      error,
    );

    return {
      success: false,
      message:
        "❌ Gagal memulai Tebak Gambar.",
    };
  } finally {
    connection.release();
  }
}

async function giveHint(sock, groupId) {
  if (!groupId?.endsWith("@g.us")) {
    return {
      success: false,
      message:
        "❌ Tebak Gambar hanya bisa dimainkan di grup.",
    };
  }

  const game = await getActiveGame(groupId);

  if (!game) {
    return {
      success: false,
      message:
        "❌ Tidak ada Tebak Gambar yang sedang berlangsung.",
    };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [lockedGames] = await connection.query(
      `
      SELECT
        id,
        current_stage,
        status
      FROM active_guess_games
      WHERE id = ?
      FOR UPDATE
      `,
      [game.id],
    );

    if (lockedGames.length === 0) {
      await connection.rollback();

      return {
        success: false,
        message: "❌ Game tidak ditemukan.",
      };
    }

    const lockedGame = lockedGames[0];

    if (lockedGame.status !== "active") {
      await connection.rollback();

      return {
        success: false,
        message: "❌ Game sudah selesai.",
      };
    }

    const currentStage = Number(
      lockedGame.current_stage,
    );

    let nextStage;
    let clue;

    if (currentStage === 0) {
      nextStage = 1;
      clue = game.clue1;
    } else if (currentStage === 1) {
      nextStage = 2;
      clue = game.clue2;
    } else if (currentStage === 2) {
      nextStage = 3;
      clue = game.clue3;
    } else {
      await connection.rollback();

      return {
        success: false,
        message: "💡 Semua petunjuk sudah dibuka.",
      };
    }

    await connection.query(
      `
      UPDATE active_guess_games
      SET current_stage = ?
      WHERE id = ?
      `,
      [nextStage, game.id],
    );

    await connection.commit();

    const points = getPointsByStage(nextStage);

    await sock.sendMessage(groupId, {
      text:
        `💡 *PETUNJUK ${nextStage}*\n\n` +
        `${clue || "Tidak ada petunjuk."}\n\n` +
        `🏆 Jawaban benar sekarang: *${points} poin*`,
    });

    return {
      success: true,
      message:
        `Petunjuk ${nextStage} berhasil dibuka.`,
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    console.error(
      "Give hint error:",
      error,
    );

    return {
      success: false,
      message:
        "❌ Gagal memberikan petunjuk.",
    };
  } finally {
    connection.release();
  }
}

async function finishExpiredGame(gameId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [games] = await connection.query(
      `
      SELECT
        g.id,
        g.group_id,
        g.status
      FROM active_guess_games g
      WHERE g.id = ?
      FOR UPDATE
      `,
      [gameId],
    );

    if (games.length === 0) {
      await connection.rollback();

      return {
        success: false,
        finished: false,
        message: "Game tidak ditemukan.",
      };
    }

    const game = games[0];

    if (game.status !== "active") {
      await connection.rollback();

      return {
        success: true,
        finished: false,
        message: "Game sudah selesai.",
      };
    }

    await connection.query(
      `
      UPDATE active_guess_games
      SET
        status = 'expired',
        finished_at = NOW()
      WHERE id = ?
      `,
      [gameId],
    );

    await connection.commit();

    clearGameTimer(game.group_id);

    return {
      success: true,
      finished: true,
      message:
        "⏰ *WAKTU HABIS!*\n\n" +
        "❌ *ANDA GAGAL MENEBak GAMBAR.*\n\n" +
        "🔒 Foto asli tetap disembunyikan karena tidak ada jawaban yang benar.\n\n" +
        "🎯 Coba lagi di game berikutnya!",
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    console.error(
      "Finish expired game error:",
      error,
    );

    return {
      success: false,
      finished: false,
      message:
        "❌ Gagal menyelesaikan game.",
    };
  } finally {
    connection.release();
  }
}

async function finishWinner(
  gameId,
  winnerPlayerId,
  points,
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [games] = await connection.query(
      `
      SELECT
        g.id,
        g.group_id,
        g.status,
        q.answer,
        q.image_path
      FROM active_guess_games g
      INNER JOIN fishing_questions q
        ON q.id = g.question_id
      WHERE g.id = ?
      FOR UPDATE
      `,
      [gameId],
    );

    if (games.length === 0) {
      await connection.rollback();

      return {
        success: false,
        finished: false,
        message: "Game tidak ditemukan.",
      };
    }

    const game = games[0];

    if (game.status !== "active") {
      await connection.rollback();

      return {
        success: false,
        finished: false,
        message: "Game sudah selesai.",
      };
    }

    const [players] = await connection.query(
      `
      SELECT
        id,
        name
      FROM players
      WHERE id = ?
      LIMIT 1
      `,
      [winnerPlayerId],
    );

    if (players.length === 0) {
      await connection.rollback();

      return {
        success: false,
        finished: false,
        message:
          "Player pemenang tidak ditemukan.",
      };
    }

    const winner = players[0];

    const [participants] = await connection.query(
      `
      SELECT DISTINCT
        player_id
      FROM guess_answers
      WHERE game_id = ?
      `,
      [gameId],
    );

    await connection.query(
      `
      UPDATE active_guess_games
      SET
        status = 'won',
        winner_player_id = ?,
        finished_at = NOW()
      WHERE id = ?
      `,
      [winnerPlayerId, gameId],
    );

    for (const participant of participants) {
      const playerId = participant.player_id;

      const [updateResult] =
        await connection.query(
          `
          UPDATE guess_scores
          SET
            games_played = games_played + 1
          WHERE player_id = ?
          `,
          [playerId],
        );

      if (updateResult.affectedRows === 0) {
        await connection.query(
          `
          INSERT INTO guess_scores
          (
            player_id,
            total_points,
            correct_answers,
            games_played
          )
          VALUES
          (?, 0, 0, 1)
          `,
          [playerId],
        );
      }
    }

    const [winnerScore] =
      await connection.query(
        `
        SELECT id
        FROM guess_scores
        WHERE player_id = ?
        LIMIT 1
        `,
        [winnerPlayerId],
      );

    if (winnerScore.length === 0) {
      await connection.query(
        `
        INSERT INTO guess_scores
        (
          player_id,
          total_points,
          correct_answers,
          games_played
        )
        VALUES
        (?, ?, 1, 0)
        `,
        [winnerPlayerId, points],
      );
    } else {
      await connection.query(
        `
        UPDATE guess_scores
        SET
          total_points = total_points + ?,
          correct_answers = correct_answers + 1
        WHERE player_id = ?
        `,
        [points, winnerPlayerId],
      );
    }

    await connection.query(
      `
      UPDATE players
      SET
        gold = gold + ?
      WHERE id = ?
      `,
      [WIN_GOLD_REWARD, winnerPlayerId],
    );

    await connection.commit();

    clearGameTimer(game.group_id);

    return {
      success: true,
      finished: true,
      winnerName: winner.name,
      answer: game.answer,
      imagePath: game.image_path,
      points,
      gold: WIN_GOLD_REWARD,
      message:
        "🎉 *TEBAK GAMBAR TERJAWAB!*\n\n" +
        `👑 Pemenang: *${winner.name}*\n` +
        `✅ Jawaban: *${game.answer}*\n` +
        `🏆 Poin: +${points}\n` +
        `💰 Gold: +${WIN_GOLD_REWARD}\n\n` +
        "📸 *NIH FOTO ASLINYA!*\n" +
        "🎯 Game selesai!",
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    console.error(
      "Finish winner error:",
      error,
    );

    return {
      success: false,
      finished: false,
      message:
        "❌ Gagal menyelesaikan Tebak Gambar.",
    };
  } finally {
    connection.release();
  }
}

export async function handleGuessAnswer(
  sock,
  groupId,
  userId,
  answerText,
) {
  if (!groupId?.endsWith("@g.us")) {
    return false;
  }

  if (
    !answerText ||
    answerText.startsWith("/")
  ) {
    return false;
  }

  const game = await getActiveGame(groupId);

  if (!game) {
    return false;
  }

  const player =
    await getPlayerByWhatsappId(userId);

  if (!player) {
    await sock.sendMessage(groupId, {
      text:
        "❌ Kamu belum terdaftar.\n\n" +
        "Gunakan:\n" +
        "/daftar NamaKamu",
    });

    return true;
  }

  const correct = checkAnswer(
    answerText,
    game,
  );

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [lockedGames] =
      await connection.query(
        `
        SELECT
          id,
          current_stage,
          status
        FROM active_guess_games
        WHERE id = ?
        FOR UPDATE
        `,
        [game.id],
      );

    if (
      lockedGames.length === 0 ||
      lockedGames[0].status !== "active"
    ) {
      await connection.rollback();
      return true;
    }

    const currentStage = Number(
      lockedGames[0].current_stage,
    );

    const points = correct
      ? getPointsByStage(currentStage)
      : 0;

    await connection.query(
      `
      INSERT INTO guess_answers
      (
        game_id,
        player_id,
        answer,
        is_correct,
        points_earned
      )
      VALUES
      (?, ?, ?, ?, ?)
      `,
      [
        game.id,
        player.id,
        answerText.trim(),
        correct ? 1 : 0,
        points,
      ],
    );

    await connection.commit();

    if (!correct) {
      await sock.sendMessage(groupId, {
        text:
          "❌ Belum tepat.\n" +
          "🌑 Foto masih disembunyikan. Coba lagi! 👀",
      });

      return true;
    }

    const result = await finishWinner(
      game.id,
      player.id,
      points,
    );

    if (result.finished) {
      const originalImage =
        getImageContent(result.imagePath);

      if (originalImage) {
        await sock.sendMessage(groupId, {
          image: originalImage,
          caption: result.message,
        });
      } else {
        await sock.sendMessage(groupId, {
          text:
            result.message +
            "\n\n⚠️ Foto asli gagal dimuat.",
        });
      }
    }

    return true;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    console.error(
      "Handle guess answer error:",
      error,
    );

    await sock.sendMessage(groupId, {
      text:
        "❌ Terjadi kesalahan saat memproses jawaban.",
    });

    return true;
  } finally {
    connection.release();
  }
}

async function getGuessScores() {
  const [rows] = await pool.query(
    `
    SELECT
      gs.player_id,
      p.name,
      gs.total_points,
      gs.correct_answers,
      gs.games_played
    FROM guess_scores gs
    INNER JOIN players p
      ON p.id = gs.player_id
    ORDER BY
      gs.total_points DESC,
      gs.correct_answers DESC,
      gs.games_played ASC
    LIMIT 10
    `,
  );

  return rows;
}

async function getPlayerScore(whatsappId) {
  const player =
    await getPlayerByWhatsappId(
      whatsappId,
    );

  if (!player) {
    return null;
  }

  const [rows] = await pool.query(
    `
    SELECT
      total_points,
      correct_answers,
      games_played
    FROM guess_scores
    WHERE player_id = ?
    LIMIT 1
    `,
    [player.id],
  );

  return {
    player,
    score:
      rows[0] || {
        total_points: 0,
        correct_answers: 0,
        games_played: 0,
      },
  };
}

export async function handleGuessCommand(
  sock,
  groupId,
  userId,
  argument,
) {
  if (!groupId?.endsWith("@g.us")) {
    return {
      success: false,
      message:
        "❌ Tebak Gambar hanya bisa dimainkan di grup.",
    };
  }

  const command = String(argument || "")
    .trim()
    .toLowerCase();

  if (
    command === "" ||
    command === "mulai"
  ) {
    return startGame(
      sock,
      groupId,
      userId,
    );
  }

  if (
    command === "petunjuk" ||
    command === "clue"
  ) {
    return giveHint(
      sock,
      groupId,
    );
  }

  if (
    command === "skor" ||
    command === "score"
  ) {
    const scores =
      await getGuessScores();

    if (scores.length === 0) {
      return {
        success: true,
        message:
          "🏆 Belum ada skor Tebak Gambar.",
      };
    }

    let message =
      "🏆 *LEADERBOARD TEBAK GAMBAR*\n\n";

    scores.forEach((player, index) => {
      const medal =
        index === 0
          ? "🥇"
          : index === 1
            ? "🥈"
            : index === 2
              ? "🥉"
              : `${index + 1}.`;

      message +=
        `${medal} *${player.name}*\n` +
        `   🏆 Poin: ${player.total_points}\n` +
        `   ✅ Benar: ${player.correct_answers}\n` +
        `   🎮 Main: ${player.games_played}\n\n`;
    });

    return {
      success: true,
      message: message.trim(),
    };
  }

  if (
    command === "saya" ||
    command === "myscore"
  ) {
    const result =
      await getPlayerScore(userId);

    if (!result) {
      return {
        success: false,
        message:
          "❌ Kamu belum terdaftar.\n\n" +
          "Gunakan:\n" +
          "/daftar NamaKamu",
      };
    }

    return {
      success: true,
      message:
        "🏆 *SKOR TEBAK GAMBAR KAMU*\n\n" +
        `👤 ${result.player.name}\n` +
        `🏆 Total poin: ${result.score.total_points}\n` +
        `✅ Jawaban benar: ${result.score.correct_answers}\n` +
        `🎮 Game dimainkan: ${result.score.games_played}`,
    };
  }

  return {
    success: false,
    message:
      "🖼️ *CARA TEBAK GAMBAR*\n\n" +
      "/tebakgambar\n" +
      "Memulai game Tebak Gambar.\n\n" +
      "/tebakgambar petunjuk\n" +
      "Membuka petunjuk berikutnya.\n\n" +
      "/tebakgambar skor\n" +
      "Melihat leaderboard.\n\n" +
      "/tebakgambar saya\n" +
      "Melihat skor kamu sendiri.",
  };
}
