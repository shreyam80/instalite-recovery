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
