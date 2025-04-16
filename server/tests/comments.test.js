// ===============================================
// EXPECTED FUNCTIONS - Comments Module
// ===============================================
//
// Function: addComment(postId, userId, text, parentCommentId = null)
// - Params: postId, userId, comment text, optional parentCommentId
// - Returns: { success, commentId } or { error }
// - Description: Adds a comment to a post, or a reply if parentCommentId is set
//
// Function: likeComment(commentId, userId)
// - Params: commentId, userId
// - Returns: { success } or { error }
// - Description: Adds a like to a comment (only once per user)
//
// Function: unlikeComment(commentId, userId)
// - Params: commentId, userId
// - Returns: { success } or { error }
// - Description: Removes a like from a comment
//
// Function: deleteComment(commentId, userId)
// - Params: commentId, userId
// - Returns: { success } or { error }
// - Description: Deletes the comment if it belongs to the requesting user,
//                OR if the user owns the post that the comment is under.
//
// Function: getCommentsForPost(postId)
// - Params: postId
// - Returns: [{ commentId, userId, text, timestamp, parentCommentId, likes }]
// - Description: Fetches all comments for a post (including threaded replies),
//                ordered by number of likes descending
//
// ===============================================
import {
    addComment,
    likeComment,
    unlikeComment,
    deleteComment,
    getCommentsForPost
  } from '../../comments.js';
  
  import {
    createUser,
    authenticateUser,
    createPost
  } from '../../users.js'; // adjust if in a different file
  
  let testUserId;
  let testPostId;
  let testCommentId;
  
  beforeAll(async () => {
    // Create test user
    const user = {
      login: 'commentuser',
      password: 'testpass456',
      firstName: 'Comment',
      lastName: 'Tester',
      email: 'comment@example.com',
      affiliation: 'Penn',
      birthday: '2003-10-10',
      hashtags: ['#test']
    };
    await createUser(user);
    const auth = await authenticateUser('commentuser', 'testpass456');
    testUserId = auth.userId;
  
    // Create a test post to comment on
    const post = await createPost(testUserId, "This is a test post.");
    testPostId = post.postId;
  });
  
  
  // ----------------------------------
  // Test: addComment
  // ----------------------------------
  test('addComment creates a comment on a post', async () => {
    const res = await addComment(testPostId, testUserId, "This is a test comment.");
    expect(res.success).toBe(true);
    expect(res.commentId).toBeDefined();
    testCommentId = res.commentId; // Save for later tests
  });
  
  
  // ----------------------------------
  // Test: likeComment
  // ----------------------------------
  test('likeComment increments the like count', async () => {
    const res = await likeComment(testCommentId, testUserId);
    expect(res.success).toBe(true);
  
    const comments = await getCommentsForPost(testPostId);
    const comment = comments.find(c => c.commentId === testCommentId);
    expect(comment.likes).toBeGreaterThan(0);
  });
  
  
  // ----------------------------------
  // Test: unlikeComment
  // ----------------------------------
  test('unlikeComment decrements the like count', async () => {
    const res = await unlikeComment(testCommentId, testUserId);
    expect(res.success).toBe(true);
  
    const comments = await getCommentsForPost(testPostId);
    const comment = comments.find(c => c.commentId === testCommentId);
    expect(comment.likes).toBe(0);
  });
  
  
  // ----------------------------------
  // Test: getCommentsForPost
  // ----------------------------------
  test('getCommentsForPost retrieves all comments ordered by likes', async () => {
    // Add two comments with different like counts
    const res1 = await addComment(testPostId, testUserId, "First comment");
    const res2 = await addComment(testPostId, testUserId, "Second comment");
  
    await likeComment(res2.commentId, testUserId); // Only like second one
  
    const comments = await getCommentsForPost(testPostId);
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBeGreaterThanOrEqual(2);
    expect(comments[0].likes).toBeGreaterThanOrEqual(comments[1].likes);
  });
  
  
  // ----------------------------------
  // Test: deleteComment (as comment author)
  // ----------------------------------
  test('deleteComment removes the comment as author', async () => {
    const res = await addComment(testPostId, testUserId, "To be deleted");
    const deleteRes = await deleteComment(res.commentId, testUserId);
    expect(deleteRes.success).toBe(true);
  });
  