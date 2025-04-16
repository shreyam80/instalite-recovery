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
} from '../../users.js';

import {
  createPost
} from '../../posts.js';

let testUserId;
let testPostId;
let testCommentId;

beforeAll(async () => {
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

  const post = await createPost(testUserId, "This is a test post.");
  testPostId = post.postId;
});

test('addComment creates a comment on a post', async () => {
  const res = await addComment(testPostId, testUserId, "This is a test comment.");
  expect(res.success).toBe(true);
  expect(res.commentId).toBeDefined();
  testCommentId = res.commentId;
});

test('likeComment increments the like count', async () => {
  const res = await likeComment(testCommentId, testUserId);
  expect(res.success).toBe(true);

  const comments = await getCommentsForPost(testPostId);
  const comment = comments.find(c => c.commentId === testCommentId);
  expect(comment.likes).toBeGreaterThan(0);
});

test('unlikeComment decrements the like count', async () => {
  const res = await unlikeComment(testCommentId, testUserId);
  expect(res.success).toBe(true);

  const comments = await getCommentsForPost(testPostId);
  const comment = comments.find(c => c.commentId === testCommentId);
  expect(comment.likes).toBe(0);
});

test('getCommentsForPost retrieves all comments ordered by likes', async () => {
  const res1 = await addComment(testPostId, testUserId, "First comment");
  const res2 = await addComment(testPostId, testUserId, "Second comment");

  await likeComment(res2.commentId, testUserId);

  const comments = await getCommentsForPost(testPostId);
  expect(Array.isArray(comments)).toBe(true);
  expect(comments.length).toBeGreaterThanOrEqual(2);
  expect(comments[0].likes).toBeGreaterThanOrEqual(comments[1].likes);
});
