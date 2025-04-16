// ===============================================
// EXPECTED FUNCTIONS - Posts Module
// ===============================================
//
// Function: createPost(userId, text, imageUrl = null, hashtags = [])
// - Params: userId, post content (text), optional image URL, optional hashtags
// - Returns: { success, postId } or { error }
// - Description: Creates a new post and increments each unique hashtag in the PostHashtags database
//
// Function: deletePost(postId, userId)
// - Params: postId, userId
// - Returns: { success } or { error }
// - Description: Deletes a post if the user is the original author
//
// Function: likePost(postId, userId)
// - Params: postId, userId
// - Returns: { success } or { error }
// - Description: Adds a like from the user to the post
//
// Function: unlikePost(postId, userId)
// - Params: postId, userId
// - Returns: { success } or { error }
// - Description: Removes a like from the post by that user
//
// Function: getPostsForUser(userId)
// - Params: userId
// - Returns: Array of posts with metadata (text, timestamp, author, image, like count)
// - Description: Gets user’s feed, including their posts and friends’/hashtag/external ranked posts
//
// ===============================================
import {
    createPost,
    deletePost,
    likePost,
    unlikePost,
    getPostsForUser
  } from '../../posts.js';
  
  import {
    createUser,
    authenticateUser
  } from '../../users.js';
  
  let testUserId;
  let testPostId;
  
  beforeAll(async () => {
    // Create test user
    const user = {
      login: 'postuser',
      password: 'postpass123',
      firstName: 'Poster',
      lastName: 'McTest',
      email: 'poster@example.com',
      affiliation: 'Penn',
      birthday: '2002-02-02',
      hashtags: ['#intro']
    };
    await createUser(user);
    const auth = await authenticateUser('postuser', 'postpass123');
    testUserId = auth.userId;
  });
  
  // ----------------------------------
  // Test: createPost
  // ----------------------------------
  test('createPost creates a post with text and hashtags', async () => {
    const res = await createPost(testUserId, "My first test post", null, ["#test", "#jest"]);
    expect(res.success).toBe(true);
    expect(res.postId).toBeDefined();
    testPostId = res.postId;
  });
  
  // ----------------------------------
  // Test: likePost
  // ----------------------------------
  test('likePost increases like count', async () => {
    const res = await likePost(testPostId, testUserId);
    expect(res.success).toBe(true);
  
    const posts = await getPostsForUser(testUserId);
    const post = posts.find(p => p.postId === testPostId);
    expect(post.likeCount).toBeGreaterThan(0);
  });
  
  // ----------------------------------
  // Test: unlikePost
  // ----------------------------------
  test('unlikePost decreases like count', async () => {
    const res = await unlikePost(testPostId, testUserId);
    expect(res.success).toBe(true);
  
    const posts = await getPostsForUser(testUserId);
    const post = posts.find(p => p.postId === testPostId);
    expect(post.likeCount).toBe(0);
  });
  
  // ----------------------------------
  // Test: getPostsForUser
  // ----------------------------------
  test('getPostsForUser retrieves user’s own post', async () => {
    const posts = await getPostsForUser(testUserId);
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
  
    const post = posts.find(p => p.postId === testPostId);
    expect(post).toBeDefined();
    expect(post.text).toBe("My first test post");
    expect(post.author).toBeDefined();
  });
  
  // ----------------------------------
  // Test: deletePost
  // ----------------------------------
  test('deletePost removes post if user is the author', async () => {
    const res = await deletePost(testPostId, testUserId);
    expect(res.success).toBe(true);
  
    const posts = await getPostsForUser(testUserId);
    const found = posts.find(p => p.postId === testPostId);
    expect(found).toBeUndefined();
  });
  