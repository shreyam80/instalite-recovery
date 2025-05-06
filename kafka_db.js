import { get_db_connection } from './server/models/rdbms.js';

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
        INSERT INTO users (username, email, first_name, last_name, hashed_password)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.insert_items(insertUserSql, [
        post.username,
        `${post.username}@external.com`, // dummy email
        post.username,
        'Kafka', 
        'kafka_user_dummy_password'
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

    // Check if post already exists by external_site_id
    // Check if a post from the same user with the same text already exists from the same external site
    const [[existingPost]] = await db.send_sql(
      `
        SELECT post_id FROM posts
        WHERE external_site_id = ?
          AND text_content = ?
          AND author = ?
      `,
      [post.source_site, post.post_text, userId]
    );

    if (existingPost) {
      console.log("Duplicate post skipped:", post.source_site, post.post_text);
      return;
    }


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
