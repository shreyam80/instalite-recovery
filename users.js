import { get_db_connection } from "../models/rdbms.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const db = get_db_connection();
const SECRET_KEY = process.env.JWT_SECRET || "changeme";

export async function createUser({ login, password, firstName, lastName, email, affiliation, birthday, hashtags }) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
  
      await db.send_sql(
        `INSERT INTO users 
         (username, hashed_password, email, first_name, last_name, affiliation, hashtag_text) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [login, hashedPassword, email, firstName, lastName, affiliation, JSON.stringify(hashtags)]
      );
  
      return { success: true };
    } catch (err) {
      console.error("createUser error:", err);
      return { error: "User creation failed" };
    }
}

export async function authenticateUser({ login, password }) {
  try {
    const [users] = await db.send_sql(
      "SELECT user_id, hashed_password FROM users WHERE username = ? OR email = ?",
      [login, login]
    );
    if (users.length === 0) return { error: "User not found" };

    const user = users[0];
    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) return { error: "Invalid password" };

    const token = jwt.sign({ userId: user.user_id }, SECRET_KEY, { expiresIn: "1h" });
    return { userId: user.user_id, token };
  } catch (err) {
    console.error("authenticateUser error:", err);
    return { error: "Authentication failed" };
  }
}

export async function getUserById(userId) {
  try {
    const [users] = await db.send_sql("SELECT * FROM users WHERE user_id = ?", [userId]);
    if (users.length === 0) return null;
    return users[0];
  } catch (err) {
    console.error("getUserById error:", err);
    return null;
  }
}

export async function updateUserEmail(userId, newEmail) {
  try {
    await db.send_sql("UPDATE users SET email = ? WHERE user_id = ?", [newEmail, userId]);
    return { success: true };
  } catch (err) {
    console.error("updateUserEmail error:", err);
    return { error: "Failed to update email" };
  }
}

export async function updateUserPassword(userId, newPassword) {
  try {
    await db.send_sql("UPDATE users SET hashed_password = ? WHERE user_id = ?", [newPassword, userId]);
    return { success: true };
  } catch (err) {
    console.error("updateUserPassword error:", err);
    return { error: "Failed to update password" };
  }
}

export async function updateHashtags(userId, hashtagList) {
  try {
    await db.send_sql("UPDATE users SET hashtag_text = ? WHERE user_id = ?", [
      JSON.stringify(hashtagList),
      userId,
    ]);
    return { success: true };
  } catch (err) {
    console.error("updateHashtags error:", err);
    return { error: "Failed to update hashtags" };
  }
}

export async function setUserOnlineStatus(userId, isOnline) {
  try {
    await db.send_sql("UPDATE users SET is_online = ? WHERE user_id = ?", [isOnline, userId]);
    return { success: true };
  } catch (err) {
    console.error("setUserOnlineStatus error:", err);
    return { error: "Failed to update online status" };
  }
}

export async function getTopHashtags() {
  try {
    const [rows] = await db.send_sql("SELECT hashtag FROM hashtags ORDER BY count DESC LIMIT 10");
    return rows.map((row) => row.hashtag);
  } catch (err) {
    console.error("getTopHashtags error:", err);
    return { error: "Failed to retrieve top hashtags" };
  }
}