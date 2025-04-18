import { get_db_connection } from '../models/rdbms.js';

export async function saveKafkaPost(post) {
  const db = get_db_connection();
  await db.connect();

  try {
    // 1. Look up user_id for the username (create if doesn't exist)
    const [rows] = await db.send_sql(
      'SELECT user_id FROM users WHERE username = ?',
      [post.username]
    );

    let userId;

    if (rows.length === 0) {
      const insertUserSql = `
        INSERT INTO users (username, email, first_name, last_name)
        VALUES (?, ?, ?, ?)
      `;
      await db.insert_items(insertUserSql, [
        post.username,
        `${post.username}@external.com`, // dummy email
        post.username,
        'Kafka'
      ]);

      // re-fetch the new user_id
      const [newUserRow] = await db.send_sql(
        'SELECT user_id FROM users WHERE username = ?',
        [post.username]
      );
      userId = newUserRow[0].user_id;
    } else {
      userId = rows[0].user_id;
    }

    // 2. Insert into posts
    const insertPostSql = `
      INSERT INTO posts (
        author, text_content, image_url, is_external, external_site_id, file_key
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userId,
      post.post_text,
      post.attach ?? null,
      true,
      post.source_site,
      null
    ];

    await db.insert_items(insertPostSql, params);
    console.log('Inserted Kafka post into DB');

    // 3. Optionally insert hashtags (if they exist)
    if (post.hashtags && Array.isArray(post.hashtags)) {
      const [[latestPost]] = await db.send_sql(
        'SELECT post_id FROM posts WHERE author = ? ORDER BY timestamp DESC LIMIT 1',
        [userId]
      );

      for (const hashtag of post.hashtags) {
        await db.insert_items(
          'INSERT IGNORE INTO post_hashtags (post_id, hashtag) VALUES (?, ?)',
          [latestPost.post_id, hashtag]
        );
      }
      console.log('Inserted post hashtags');
    }

  } catch (err) {
    console.error('Error inserting Kafka post:', err);
  }
}
