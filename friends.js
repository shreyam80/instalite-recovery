// friends.js

import { get_db_connection } from  './server/models/rdbms.js';

const db = get_db_connection();

export async function getFriendsForUser(userId) {
  // make sure we have a live connection
  await db.connect();

  // “friends” table has (follower, following)
  // here we return the users that “userId” is following
  const [rows] = await db.send_sql(
    `SELECT 
       u.user_id   AS userId,
       u.first_name AS firstName,
       u.last_name  AS lastName
     FROM friends f
     JOIN users   u ON u.user_id = f.following
     WHERE f.follower = ?
    `,
    [userId]
  );

  return rows;  // [ { userId, firstName, lastName }, … ]
}
