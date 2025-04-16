import { get_db_connection } from "../models/rdbms.js";

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

    return { success: true };
  } catch (err) {
    console.error("deletePost error:", err);
    return { error: "Failed to delete post" };
  }
}

export async function likePost(postId, userId) {
  try {
    const [post] = await db.send_sql("SELECT likes FROM posts WHERE post_id = ?", [postId]);
    if (post.length === 0) return { error: "Post not found" };

    const likes = post[0].likes ? JSON.parse(post[0].likes) : [];
    if (!likes.includes(userId)) likes.push(userId);

    await db.send_sql("UPDATE posts SET likes = ? WHERE post_id = ?", [
      JSON.stringify(likes),
      postId,
    ]);

    return { success: true };
  } catch (err) {
    console.error("likePost error:", err);
    return { error: "Failed to like post" };
  }
}

export async function unlikePost(postId, userId) {
  try {
    const [post] = await db.send_sql("SELECT likes FROM posts WHERE post_id = ?", [postId]);
    if (post.length === 0) return { error: "Post not found" };

    let likes = post[0].likes ? JSON.parse(post[0].likes) : [];
    likes = likes.filter((id) => id !== userId);

    await db.send_sql("UPDATE posts SET likes = ? WHERE post_id = ?", [
      JSON.stringify(likes),
      postId,
    ]);

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

/**
 * This function is not ranked yet, I'm only tacking databases so I'm checking whether the posts are retrieved or not
 */
export async function getPostsForUser(userId) {
  try {
    const [friends] = await db.send_sql(
      "SELECT following FROM friends WHERE follower = ?",
      [userId]
    );
    const friendIds = friends.map((f) => f.following);
    const userAndFriends = [userId, ...friendIds];

    const [posts] = await db.send_sql(
      `SELECT p.post_id, p.text_content, p.timestamp, p.image_url, p.likes, 
              u.username AS author_username, u.profile_image_url
         FROM posts p
         JOIN users u ON p.author = u.user_id
        WHERE p.author IN (?) 
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
      likeCount: post.likes ? JSON.parse(post.likes).length : 0,
    }));
  } catch (err) {
    console.error("getPostsForUser error:", err);
    return { error: "Failed to retrieve posts" };
  }
}
