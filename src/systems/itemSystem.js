import pool from "../databases/database.js";

export async function addItem(
playerId,
itemId,
quantity = 1,
connection = pool,
) {
if (!playerId) {
throw new Error(
"Player ID tidak ditemukan.",
);
}

if (!itemId) {
throw new Error(
"Item ID tidak ditemukan.",
);
}

if (
!Number.isInteger(quantity) ||
quantity <= 0
) {
throw new Error(
"Quantity item tidak valid.",
);
}

// Cek apakah item tersedia di database.
const [items] =
await connection.query(
`       SELECT
        id
      FROM items
      WHERE id = ?
      LIMIT 1
      `,
[itemId],
);

if (
items.length === 0
) {
throw new Error(
`Item ${itemId} tidak ditemukan di database.`,
);
}

/*

* Jika item belum ada untuk player:
* INSERT quantity
*
* Jika item sudah ada:
* quantity lama + quantity baru
*
* Tidak menggunakan VALUES(quantity),
* sehingga tidak terkena warning deprecated
* pada MySQL 8.4.
  */
  await connection.query(
  `     INSERT INTO player_items
      (
   player_id,
   item_id,
   quantity
      )
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
   quantity = quantity + ?
      `,
  [
  playerId,
  itemId,
  quantity,
  quantity,
  ],
  );
  }

export async function getPlayerItems(
playerId,
connection = pool,
) {
const [items] =
await connection.query(
`       SELECT
        pi.item_id,
        i.name,
        i.type,
        i.description,
        pi.quantity
      FROM player_items pi
      INNER JOIN items i
        ON i.id = pi.item_id
      WHERE pi.player_id = ?
        AND pi.quantity > 0
      ORDER BY
        i.type,
        i.name
      `,
[playerId],
);

return items;
}

export async function getItemQuantity(
playerId,
itemId,
connection = pool,
) {
const [rows] =
await connection.query(
`       SELECT
        quantity
      FROM player_items
      WHERE player_id = ?
        AND item_id = ?
      LIMIT 1
      `,
[
playerId,
itemId,
],
);

if (
rows.length === 0
) {
return 0;
}

return Number(
rows[0].quantity,
);
}

export async function removeItem(
playerId,
itemId,
quantity = 1,
connection = pool,
) {
if (
!Number.isInteger(quantity) ||
quantity <= 0
) {
throw new Error(
"Quantity item tidak valid.",
);
}

const currentQuantity =
await getItemQuantity(
playerId,
itemId,
connection,
);

if (
currentQuantity < quantity
) {
return {
success: false,
message:
"Item tidak cukup.",
};
}

await connection.query(
`     UPDATE player_items
    SET quantity = quantity - ?
    WHERE player_id = ?
      AND item_id = ?
    `,
[
quantity,
playerId,
itemId,
],
);

return {
success: true,
};
}
