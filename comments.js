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
    const [rows] = await db.send_sql(
      "SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?",
      [commentId, userId]
    );

    if (rows.length > 0) {
      return { error: "You have already liked this comment" };
    }
    await db.send_sql(
      `INSERT INTO comment_likes (comment_id, user_id)
       VALUES (?, ?)`,
      [commentId, userId]
    );

    return { success: true };
  } catch (err) {
    console.error("likeComment error:", err);
    return { error: "Failed to like comment" };
  }
}

export async function unlikeComment(commentId, userId) {
  try {
    const [rows] = await db.send_sql(
      "SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?",
      [commentId, userId]
    );

    if (rows.length === 0) {
      return { error: "You have not liked this comment" };
    }

    await db.send_sql(
      "DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?",
      [commentId, userId]
    );

    return { success: true };
  } catch (err) {
    console.error("unlikeComment error:", err);
    return { error: "Failed to unlike comment" };
  }
}

export async function deleteComment(commentId, userId) {
  try {
    const [rows] = await db.send_sql(
      `SELECT c.user_id AS comment_owner, p.author AS post_owner
       FROM comments c
       JOIN posts p ON c.post_id = p.post_id
       WHERE c.comment_id = ?`,
      [commentId]
    );

    if (rows.length === 0) return { error: "Comment not found" };
    const { comment_owner, post_owner } = rows[0];

    if (userId !== comment_owner && userId !== post_owner) {
      return { error: "Unauthorized" };
    }

    await db.send_sql("DELETE FROM comments WHERE comment_id = ?", [commentId]);
    await db.send_sql("DELETE FROM comment_likes WHERE comment_id = ?", [commentId]);

    return { success: true };
  } catch (err) {
    console.error("deleteComment error:", err);
    return { error: "Failed to delete comment" };
  }
}

export async function getCommentsForPost(postId) {
  try {
    const [rows] = await db.send_sql(
      `SELECT c.comment_id, c.user_id, c.text_content, c.timestamp, c.parent_comment_id,
              COUNT(cl.user_id) AS likes
         FROM comments c
         LEFT JOIN comment_likes cl ON c.comment_id = cl.comment_id
        WHERE c.post_id = ?
        GROUP BY c.comment_id
        ORDER BY c.timestamp DESC`,
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
