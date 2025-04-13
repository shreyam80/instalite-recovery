import { get_db_connection, RelationalDB } from '../models/rdbms.js';

// Database connection setup
const dbaccess = get_db_connection();

function sendQueryOrCommand(db, query, params = []) {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

async function create_tables() {

  /**
   * These should exist from HW2 and 3
   */

  // Note here that birth/death year should really be int but have often been put as string
  await dbaccess.create_tables(`CREATE TABLE IF NOT EXISTS users (
    user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    username VARCHAR(255) UNIQUE, \
    hashed_password VARCHAR(255), \
    email VARCHAR(255) UNIQUE, \
    first_name VARCHAR(255), \
    last_name VARCHAR(255), \
    affiliation VARCHAR(255), \
    profile_image_url TEXT, \
    linked_actor_id VARCHAR(255), \
    is_online BOOLEAN DEFAULT FALSE \
  );`);

  await dbaccess.create_tables('CREATE TABLE IF NOT EXISTS friends ( \
    follower INT, \
    following INT, \
    FOREIGN KEY (follower) REFERENCES users(user_id), \
    FOREIGN KEY (following) REFERENCES users(user_id) \
    );')

  await dbaccess.create_tables("CREATE TABLE IF NOT EXISTS posts ( \
    post_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
    author INT, \
    text_content TEXT, \
    image_url TEXT, \
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \
    comment_id INT, \
    likes TEXT, \
    is_external BOOLEAN DEFAULT FALSE, \
    external_site_id VARCHAR(255), \
    file_key VARCHAR(255), \
    FOREIGN KEY (author) REFERENCES users(user_id) \
  );");

  await dbaccess.create_tables('CREATE TABLE IF NOT EXISTS posts ( \
    post_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
    parent_post INT, \
    title VARCHAR(255), \
    content VARCHAR(255), \
    author_id INT, \
    FOREIGN KEY (parent_post) REFERENCES posts(post_id), \
    FOREIGN KEY (author_id) REFERENCES users(user_id) \
    );')

  await dbaccess.create_tables("CREATE TABLE IF NOT EXISTS post_hashtags ( \
    post_id INT, \
    hashtag VARCHAR(255), \
    PRIMARY KEY (post_id, hashtag), \
    FOREIGN KEY (post_id) REFERENCES posts(post_id) \
  );");

  await dbaccess.create_tables("CREATE TABLE IF NOT EXISTS user_hashtags ( \
    user_id INT, \
    hashtag VARCHAR(255), \
    PRIMARY KEY (user_id, hashtag), \
    FOREIGN KEY (user_id) REFERENCES users(user_id) \
  );");

  await dbaccess.create_tables("CREATE TABLE IF NOT EXISTS chat_sessions ( \
    chat_session_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
    creation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \
    chat_members TEXT \
  );");

  await dbaccess.create_tables("CREATE TABLE IF NOT EXISTS chat_messages ( \
    message_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
    chat_session_id INT, \
    user_id INT, \
    text_content TEXT, \
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(chat_session_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id) \
  );");

  await dbaccess.create_tables("CREATE TABLE IF NOT EXISTS comments ( \
    comment_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
    post_id INT, \
    user_id INT, \
    text_content TEXT, \
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, \
    parent_comment_id INT, \
    likes TEXT, \
    FOREIGN KEY (post_id) REFERENCES posts(post_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id), \
    FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id) \
  );");

    return null;
}

console.log('Creating tables');

async function create_populate() {
  await dbaccess.connect();
  await create_tables();
  console.log('Tables created');
}

create_populate().then(() => {
  console.log('Done');
  dbaccess.close();
}).catch((err) => {
  console.error(err);
  dbaccess.close();
}
).finally(() => {
  process.exit(0);
});

