import { get_db_connection } from './server/models/rdbms.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET_KEY = process.env.JWT_SECRET || "changeme";

export async function createUser({ login, password, firstName, lastName, email, affiliation, hashtags }) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = await get_db_connection().connect();

    const [result] = await db.send_sql(
      `INSERT INTO users 
        (username, hashed_password, email, first_name, last_name, affiliation, hashtag_text) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [login, hashedPassword, email, firstName, lastName, affiliation, JSON.stringify(hashtags)]
    );

    return { success: true, userId: result.insertId };
  } catch (err) {
    console.error("createUser error:", err);
    return { error: "User creation failed" };
  }
}

export async function authenticateUser({ login, password }) {
  try {
    const db = await get_db_connection().connect();
    const [users] = await db.send_sql(
      "SELECT user_id, hashed_password FROM users WHERE username = ? OR email = ?",
      [login, login]
    );

    if (users.length === 0) return { error: "User not found" };

    const user = users[0];
    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) return { error: "Invalid password" };

    await db.send_sql("UPDATE users SET is_online = TRUE WHERE user_id = ?", [user.user_id]);

    const token = jwt.sign({ userId: user.user_id }, SECRET_KEY, { expiresIn: "1h" });
    return { success: true, userId: user.user_id, token, is_online: true };
  } catch (err) {
    console.error("authenticateUser error:", err);
    return { error: "Authentication failed" };
  }
}

export async function getUserById(userId) {
  try {
    const db = await get_db_connection().connect();
    const [users] = await db.send_sql(
      "SELECT *, CAST(JSON_EXTRACT(hashtag_text, '$') AS CHAR) AS hashtag_text FROM users WHERE user_id = ?",
      [userId]
    );
    return users.length > 0 ? users[0] : null;
  } catch (err) {
    console.error("getUserById error:", err);
    return null;
  }
}

export async function updateUserEmail(userId, newEmail) {
  try {
    const db = await get_db_connection().connect();
    await db.send_sql("UPDATE users SET email = ? WHERE user_id = ?", [newEmail, userId]);
    return { success: true };
  } catch (err) {
    console.error("updateUserEmail error:", err);
    return { error: "Failed to update email" };
  }
}

export async function updateUserPassword(userId, newHashedPassword) {
  try {
    const db = await get_db_connection().connect();
    await db.send_sql("UPDATE users SET hashed_password = ? WHERE user_id = ?", [newHashedPassword, userId]);
    return { success: true };
  } catch (err) {
    console.error("updateUserPassword error:", err);
    return { error: "Failed to update password" };
  }
}

export async function updateHashtags(userId, hashtagList) {
  try {
    console.log("updateHashtags received hashtagList:", hashtagList);
    const db = await get_db_connection().connect();
    await db.send_sql(
      "UPDATE users SET hashtag_text = CAST(? AS JSON) WHERE user_id = ?",
      [JSON.stringify(hashtagList), userId]
    );
    return { success: true };
  } catch (err) {
    console.error("updateHashtags error:", err);
    return { error: "Failed to update hashtags" };
  }
}

export async function setUserOnlineStatus(userId, isOnline) {
  try {
    const db = await get_db_connection().connect();
    await db.send_sql("UPDATE users SET is_online = ? WHERE user_id = ?", [isOnline, userId]);
    return { success: true };
  } catch (err) {
    console.error("setUserOnlineStatus error:", err);
    return { error: "Failed to update online status" };
  }
}

export async function getTopHashtags(userId) {
  try {
    const db = await get_db_connection().connect();
    const [rows] = await db.send_sql(
      "SELECT JSON_UNQUOTE(JSON_EXTRACT(hashtag_text, '$')) AS hashtag_text FROM users WHERE user_id = ?",
      [userId]
    );
    if (rows.length === 0) return [];
    return JSON.parse(rows[0].hashtag_text || "[]");
  } catch (err) {
    console.error("getTopHashtags error:", err);
    return [];
  }
}