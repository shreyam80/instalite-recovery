import { get_db_connection } from './server/models/rdbms.js';
const db = get_db_connection();

export async function addComment(postId, userId, text, parentCommentId = null) {
  try {
    const [result] = await db.send_sql(
      `INSERT INTO comments (post_id, user_id, text_content, parent_comment_id)
       VALUES (?, ?, ?, ?)`,
      [postId, userId, text, parentCommentId]
    );
    return { success: true, commentId: result.insertId };
  } catch (err) {
    console.error("addComment error:", err);
    return { error: "Failed to add comment" };
  }
}

export async function likeComment(commentId, userId) {
  try {
    const [rows] = await db.send_sql("SELECT likes FROM comments WHERE comment_id = ?", [commentId]);
    if (rows.length === 0) return { error: "Comment not found" };

    const currentLikes = rows[0].likes ?? 0;

    await db.send_sql("UPDATE comments SET likes = ? WHERE comment_id = ?", [
      currentLikes + 1,
      commentId,
    ]);

    return { success: true };
  } catch (err) {
    console.error("likeComment error:", err);
    return { error: "Failed to like comment" };
  }
}

export async function unlikeComment(commentId, userId) {
  try {
    const [rows] = await db.send_sql("SELECT likes FROM comments WHERE comment_id = ?", [commentId]);
    if (rows.length === 0) return { error: "Comment not found" };

    const currentLikes = rows[0].likes ?? 0;
    const newLikes = Math.max(currentLikes - 1, 0);

    await db.send_sql("UPDATE comments SET likes = ? WHERE comment_id = ?", [
      newLikes,
      commentId,
    ]);

    return { success: true };
  } catch (err) {
    console.error("unlikeComment error:", err);
    return { error: "Failed to unlike comment" };
  }
}

export async function deleteComment(commentId, userId) {
  try {
    const [rows] = await db.send_sql(`
      SELECT c.user_id AS comment_owner, p.author AS post_owner
      FROM comments c
      JOIN posts p ON c.post_id = p.post_id
      WHERE c.comment_id = ?`, [commentId]);

    if (rows.length === 0) return { error: "Comment not found" };
    const { comment_owner, post_owner } = rows[0];

    if (userId !== comment_owner && userId !== post_owner) {
      return { error: "Unauthorized" };
    }

    await db.send_sql("DELETE FROM comments WHERE comment_id = ?", [commentId]);
    return { success: true };
  } catch (err) {
    console.error("deleteComment error:", err);
    return { error: "Failed to delete comment" };
  }
}

export async function getCommentsForPost(postId) {
  try {
    const [rows] = await db.send_sql(
      `SELECT comment_id, user_id, text_content, timestamp, parent_comment_id, likes
       FROM comments
       WHERE post_id = ?
       ORDER BY likes DESC`,
      [postId]
    );

    return rows.map((row) => ({
      commentId: row.comment_id,
      userId: row.user_id,
      text: row.text_content,
      timestamp: row.timestamp,
      parentCommentId: row.parent_comment_id,
      likes: row.likes,
    }));
  } catch (err) {
    console.error("getCommentsForPost error:", err);
    return { error: "Failed to fetch comments" };
  }
}