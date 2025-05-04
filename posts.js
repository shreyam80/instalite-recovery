import { get_db_connection } from './server/models/rdbms.js';
import { producePostEvent } from './server/kafka/producePostEvent.js'; // ✅ Add this line


const db = get_db_connection();

export async function createPost(userId, text, imageUrl = null, hashtags = []) {
  try {
    const [result] = await db.send_sql(
      "INSERT INTO posts (author, text_content, image_url, hashtag_text) VALUES (?, ?, ?, ?)",
      [userId, text, imageUrl, JSON.stringify(hashtags)]
    );
    const postId = result.insertId;

    if (hashtags.length > 0) {
      await linkPostToHashtags(postId, hashtags);
    }

    // NEW: Add Kafka logic here, after DB insert, before returning result
    const [userResult] = await db.send_sql(
      "SELECT username FROM users WHERE user_id = ?",
      [userId]
    );
    const username = userResult[0]?.username || `user_${userId}`;

    await producePostEvent({
      username,
      post_text: text,
      attach: imageUrl,
      hashtags
    });

    return { success: true, postId };
  } catch (err) {
    console.error("createPost error:", err);
    return { error: "Failed to create post" };
  }
}

export async function deletePost(postId, userId) {
  try {
    const [results] = await db.send_sql(
      "DELETE FROM posts WHERE post_id = ? AND author = ?",
      [postId, userId]
    );

    if (results.affectedRows === 0) {
      return { error: "Post not found or unauthorized" };
    }
    await db.send_sql("DELETE FROM post_likes WHERE post_id = ?", [postId]);

    return { success: true };
  } catch (err) {
    console.error("deletePost error:", err);
    return { error: "Failed to delete post" };
  }
}

export async function likePost(postId, userId) {
  try {
    const [rows] = await db.send_sql(
      "SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );

    if (rows.length > 0) {
      return { error: "You have already liked this post" };
    }
    await db.send_sql(
      "INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)",
      [postId, userId]
    );

    return { success: true };
  } catch (err) {
    console.error("likePost error:", err);
    return { error: "Failed to like post" };
  }
}

export async function unlikePost(postId, userId) {
  try {
    const [rows] = await db.send_sql(
      "SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );

    if (rows.length === 0) {
      return { error: "You have not liked this post" };
    }

    await db.send_sql(
      "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );

    return { success: true };
  } catch (err) {
    console.error("unlikePost error:", err);
    return { error: "Failed to unlike post" };
  }
}

export async function linkPostToHashtags(postId, hashtags) {
  try {
    for (const tag of hashtags) {
      await db.send_sql(
        `INSERT INTO hashtags (hashtag, count)
         VALUES (?, 1)
         ON DUPLICATE KEY UPDATE count = count + 1`,
        [tag]
      );
    }
    return { success: true };
  } catch (err) {
    console.error("linkPostToHashtags error:", err);
    return { error: "Failed to link hashtags" };
  }
}

export async function getPostsByUser(userId) {
  try {
    const [posts] = await db.send_sql(
      `SELECT 
         p.post_id,
         p.text_content,
         p.timestamp,
         p.image_url,
         COUNT(pl.user_id) AS like_count,
         u.username AS author_username,
         u.profile_image_url
       FROM posts p
       JOIN users u ON p.author = u.user_id
       LEFT JOIN post_likes pl ON p.post_id = pl.post_id
       WHERE p.author = ?
       GROUP BY p.post_id
       ORDER BY p.timestamp DESC`,
      [userId]
    );

    return posts.map((post) => ({
      postId: post.post_id,
      text: post.text_content,
      timestamp: post.timestamp,
      imageUrl: post.image_url,
      author: post.author_username,
      profileImage: post.profile_image_url,
      likeCount: post.like_count || 0,
    }));
  } catch (err) {
    console.error("getPostsByUserId error:", err);
    return { error: "Failed to retrieve user posts" };
  }
}

export async function getPostsForUser(userId) {
  try {
    const [friends] = await db.send_sql(
      "SELECT following FROM friends WHERE follower = ?",
      [userId]
    );
    const friendIds = friends.map((f) => f.following);
    const userAndFriends = [userId, ...friendIds];

    const [posts] = await db.send_sql(
      `SELECT p.post_id, p.text_content, p.timestamp, p.image_url, 
              u.username AS author_username, u.profile_image_url,
              COUNT(pl.user_id) AS likeCount
         FROM posts p
         JOIN users u ON p.author = u.user_id
         LEFT JOIN post_likes pl ON p.post_id = pl.post_id
        WHERE p.author IN (?)
        GROUP BY p.post_id
        ORDER BY p.timestamp DESC`,
      [userAndFriends]
    );

    return posts.map((post) => ({
      postId: post.post_id,
      text: post.text_content,
      timestamp: post.timestamp,
      imageUrl: post.image_url,
      author: post.author_username,
      profileImage: post.profile_image_url,
      likeCount: post.likeCount || 0,
    }));
  } catch (err) {
    console.error("getPostsForUser error:", err);
    return { error: "Failed to retrieve posts" };
  }
}
