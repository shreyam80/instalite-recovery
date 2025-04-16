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
