/**
 * EXPECTED FUNCTIONS - Users Module
 * 
 * - createUser(userInfo)
 *   - Params: { login, password, firstName, lastName, email, affiliation, birthday, hashtags }
 *   - Returns: { success, userId } or { error }
 *   - Notes: Password must be stored securely using bcrypt hashing.
 * 
 * - authenticateUser(login, password)
 *   - Params: { login, password }
 *   - Returns: { userId, token } or { error }
 * 
 * - getUserById(userId)
 *   - Params: userId
 *   - Returns: { userInfo } or null
 * 
 * - updateUserEmail(userId, newEmail)
 *   - Params: userId, newEmail
 *   - Returns: success/failure
 * 
 * - updateUserPassword(userId, newPassword)
 *   - Params: userId, newPassword (already hashed)
 *   - Returns: success/failure
 * 
 * - updateUserFirstName(userId, newFirstName)
 *   - Params: userId, newFirstName
 *   - Returns: success/failure
 * 
 * - updateUserLastName(userId, newLastName)
 *   - Params: userId, newLastName
 *   - Returns: success/failure
 * 
 * - updateUserAffiliation(userId, newAffiliation)
 *   - Params: userId, newAffiliation
 *   - Returns: success/failure
 * 
 * - updateHashtags(userId, hashtagList)
 *   - Params: userId, [hashtags]
 *   - Returns: success/failure
 * 
 * - setUserOnlineStatus(userId, isOnline)
 *   - Params: userId, true/false
 *   - Returns: success/failure
 * 
 * - uploadProfileImage(userId, imageBuffer = null)
 *   - Params: userId, imageBuffer (optional)
 *   - Returns: { success, url } or { error }
 *   - Description: 
 *       If imageBuffer is provided, uploads the profile image to S3 and updates the DB.
 *       If null is passed, sets the user’s profile image to the default image.
 *       Every time this is called, the linked_actor_id is cleared (set to NULL).
 * 
 * - getTopActorMatches(userId)
 *   - Params: userId
 *   - Returns: Array of top 5 actor matches based on the user’s current profile picture embedding
 *   - Notes: Returns error if user has default profile image (no embedding to match against).
 * 
 * - linkActorToUser(userId, actorId)
 *   - Params: userId, actorId
 *   - Returns: { success } or { error }
 *   - Description:
 *       - Checks if actorId is among the current top 5 matches.
 *       - If valid, updates linked_actor_id in the DB, and updates profile picture to actor’s image.
 *       - Also broadcasts a system status post: “Alice is now linked to Rebecca Ferguson.”
 * 
 * - getTopHashtags()
 *   - Params: none
 *   - Returns: [top 10 hashtags]
 */

import { expect, jest } from '@jest/globals';
import bcrypt from 'bcrypt';

// Import the expected functions from your routes file.
// Adjust the relative path based on your project structure.
import {
    createUser,
    authenticateUser,
    getUserById,
    updateUserEmail,
    updateUserPassword,
    updateUserFirstName,
    updateUserLastName,
    updateUserAffiliation,
    updateHashtags,
    setUserOnlineStatus,
    uploadProfileImage,
    getTopActorMatches,
    linkActorToUser,
    getTopHashtags
} from '../routes/register_routes.js';

// ----------------------------------
// Test: createUser - registration
// ----------------------------------
// Verify that a user is successfully registered and that the password
// is stored as a hash (not equal to the plain text).
test('createUser registers a new user with hashed password', async () => {
    const userInfo = {
        login: 'testuser',
        password: 'password123',  // plain text; function should hash this before storing
        firstName: 'Stefan',
        lastName: 'Matic',
        email: 'smatic@seas.upenn.edu',
        affiliation: 'Penn',
        birthday: '2005-11-15',
        hashtags: ['#cis', '#nets']
    };
    const res = await createUser(userInfo);
    expect(res.success).toBe(true);
    expect(res.userId).toBeDefined();

    // Retrieve the user directly to inspect stored password (if accessible in test mode)
    const userRecord = await getUserById(res.userId);
    // Check that stored password is not the plain text "password123"
    expect(userRecord.hashed_password).not.toBe("password123");
});

// ----------------------------------
// Test: authenticateUser - login validation
// ----------------------------------
// Check that valid credentials return a token and userId.
test('authenticateUser returns token on valid credentials', async () => {
    const res = await authenticateUser('testuser', 'password123');
    expect(res.success).toBe(true);
    expect(res.token).toBeDefined();
    expect(res.userId).toBeDefined();
    expect(res.is_online).toBe(true);
});

// ----------------------------------
// Test: getUserById - retrieval
// ----------------------------------
// Retrieve user details using their userId.
test('getUserById returns correct user info', async () => {
    const auth = await authenticateUser('testuser', 'password123');
    const user = await getUserById(auth.userId);
    expect(user).not.toBeNull();
    expect(user.username).toBe('testuser');
});

// ----------------------------------
// Test: updateUserEmail
// ----------------------------------
// Change user email and verify update is successful.
test('updateUserEmail updates the email on an existing user record', async () => {
    // Assume the user 'testuser' already exists from a prior test or setup.
    // First, authenticate to get the user ID.
    const auth = await authenticateUser('testuser', 'password123');
    
    // Now, update the email field for that user.
    const res = await updateUserEmail(auth.userId, 'newemail@example.com');
    expect(res.success).toBe(true);
    
    // Retrieve the user record again to verify the email was updated.
    const updatedUser = await getUserById(auth.userId);
    expect(updatedUser.email).toBe('newemail@example.com');
});

// ----------------------------------
// Test: updateUserPassword - update and revert password
// ----------------------------------
// This test verifies that updating the password does not store plaintext
// and produces a hash different from the original hash. It then reverts
// the password back to "password123" and confirms that authentication works.
test('updateUserPassword updates password and reverts to original', async () => {
    // Authenticate the user with the original password.
    const authBefore = await authenticateUser('testuser', 'password123');
    const userBefore = await getUserById(authBefore.userId);
    const originalHash = userBefore.hashed_password;
    
    // Define the new plaintext password.
    const newPasswordPlainText = 'newpassword456';
    
    // Update the user password with the new plaintext.
    const resUpdate = await updateUserPassword(authBefore.userId, newPasswordPlainText);
    expect(resUpdate.success).toBe(true);
    
    // Retrieve the updated user record.
    const userAfter = await getUserById(authBefore.userId);
    const updatedHash = userAfter.hashed_password;
    
    // Verify that the updated hash is not equal to the new plaintext password.
    expect(updatedHash).not.toBe(newPasswordPlainText);
    // Verify that the updated hash is different from the original hash.
    expect(updatedHash).not.toBe(originalHash);
    
    // Cleanup: revert password update
    const revertRes = await updateUserPassword(authBefore.userId, 'password123');
    expect(revertRes.success).toBe(true);
    
    // Confirm authentication works again with the original password.
    const authRevert = await authenticateUser('testuser', 'password123');
    expect(authRevert.success).toBe(true);
});



// ----------------------------------
// Test: updateUserFirstName
// ----------------------------------
// Update the user's first name and verify the change is persisted.
// Assume the user 'testuser' already exists from a prior test or setup.
// First, authenticate to get the user ID, update the first name,
// and then retrieve the user record to verify that first_name is updated.
test('updateUserFirstName updates first name correctly', async () => {
    const auth = await authenticateUser('testuser', 'password123');
    
    // Update the user's first name.
    const res = await updateUserFirstName(auth.userId, 'Stev');
    expect(res.success).toBe(true);
    
    // Retrieve the user record again to verify the first name update.
    const updatedUser = await getUserById(auth.userId);
    expect(updatedUser.first_name).toBe('Steve');
});


// ----------------------------------
// Test: updateUserLastName
// ----------------------------------
// Update the user's last name and verify the change is persisted.
// Assume the user 'testuser' already exists from a prior test or setup.
// First, authenticate to get the user ID, then update the last name,
// and finally retrieve the user record to confirm that last_name has been updated.
test('updateUserLastName updates last name correctly', async () => {
    const auth = await authenticateUser('testuser', 'password123');
    
    // Update the user's last name.
    const res = await updateUserLastName(auth.userId, 'Matty');
    expect(res.success).toBe(true);
    
    // Retrieve the user record again to verify the last name update.
    const updatedUser = await getUserById(auth.userId);
    expect(updatedUser.last_name).toBe('Matty');
});

// ----------------------------------
// Test: updateUserAffiliation
// ----------------------------------
// Update the user's affiliation and verify the change is persisted.
// Assume the user 'testuser' already exists from a prior test or setup.
// First, authenticate to get the user ID, update the affiliation,
// and then retrieve the user record to confirm that affiliation has been updated.
test('updateUserAffiliation updates affiliation correctly', async () => {
    const auth = await authenticateUser('testuser', 'password123');
    
    // Update the user's affiliation.
    const res = await updateUserAffiliation(auth.userId, 'Princeton');
    expect(res.success).toBe(true);
    
    // Retrieve the user record again to verify the affiliation update.
    const updatedUser = await getUserById(auth.userId);
    expect(updatedUser.affiliation).toBe('Princeton');
});


// ----------------------------------
// Test: updateHashtags
// ----------------------------------
// Update the user's hashtags and verify the change is persisted.
// Assume the user 'testuser' already exists from a prior test or setup.
// First, authenticate to get the user ID, update the hashtags,
// and then retrieve the user record to confirm that the hashtags have been updated.
test('updateHashtags updates user hashtags', async () => {
    const auth = await authenticateUser('testuser', 'password123');
    
    // Update the user's hashtags.
    const res = await updateHashtags(auth.userId, ['#phil', '#urbs']);
    expect(res.success).toBe(true);
    
    // Retrieve the user record again to verify the updated hashtags.
    const updatedUser = await getUserById(auth.userId);
    
    // Assuming the user object returns hashtags as an array under the property 'hashtags'.
    expect(Array.isArray(updatedUser.hashtags)).toBe(true);
    expect(updatedUser.hashtags).toEqual(expect.arrayContaining(['#phil', '#urbs']));
});


// ----------------------------------
// Test: setUserOnlineStatus (online & logout)
// ----------------------------------
// Simulates toggling the user's online status: first sets the status to true (login),
// then sets it to false (logout), verifying the change by re-fetching the user record.
test('setUserOnlineStatus toggles online/offline correctly', async () => {
    // Authenticate the user to get the user ID.
    const auth = await authenticateUser('testuser', 'password123');
    
    // Set the user's online status to true.
    let res = await setUserOnlineStatus(auth.userId, true);
    expect(res.success).toBe(true);
    
    // Retrieve the user record to confirm online status.
    let userRecord = await getUserById(auth.userId);
    expect(userRecord.is_online).toBe(true);
    
    // Now set the user's online status to false (simulate logout).
    res = await setUserOnlineStatus(auth.userId, false);
    expect(res.success).toBe(true);
    
    // Retrieve the user record again to confirm they are now offline.
    userRecord = await getUserById(auth.userId);
    expect(userRecord.is_online).toBe(false);
});


// ----------------------------------
// Test: uploadProfileImage - update image
// ----------------------------------
// Test that providing an image buffer updates the profile image and clears linked_actor_id.
// Then test that passing null sets the default image.
test('uploadProfileImage updates profile image and resets linked actor', async () => {
    // Test with an image buffer (simulate with a dummy Buffer)
    const dummyImage = Buffer.from('dummy image data');
    const resBuffer = await uploadProfileImage('testuser', dummyImage);
    expect(resBuffer.success).toBe(true);
    // The returned URL should be a valid S3 URL (simple regex check)
    expect(resBuffer.url).toMatch(/^https?:\/\/.*amazonaws\.com\/.*$/);

    // Test with null input: should set to default image and clear any linked_actor_id
    const resNull = await uploadProfileImage('testuser', null);
    expect(resNull.success).toBe(true);
    // Assuming default image URL contains the word "default"
    expect(resNull.url).toMatch(/default/i);
});

// ----------------------------------
// Test: getTopActorMatches returns error for default profile image
// ----------------------------------
// This test simulates a scenario where the user's profile image is set to default 
// by calling uploadProfileImage with null. Then, it calls getTopActorMatches and expects 
// an error response because a default profile image should not yield valid actor matches.
test('getTopActorMatches returns error for default profile image', async () => {
    // Set the user's profile image to default by passing null.
    const resDefault = await uploadProfileImage('testuser', null);
    expect(resDefault.success).toBe(true);
    // Check that the returned URL indicates a default image.
    expect(resDefault.url).toMatch(/default/i);
  
    // Call getTopActorMatches for the test user.
    const resultDefault = await getTopActorMatches('testuser');
    // Expect an error since the user's profile image is default.
    expect(resultDefault.error).toBeDefined();
});


// ----------------------------------
// Test: getTopActorMatches returns valid actor matches for custom profile image
// ----------------------------------
// This test first updates the user's profile image with a custom dummy image buffer,
// ensuring it's not the default image. It then calls getTopActorMatches and expects
// a valid array (with up to 5 elements) of actor matches, where each match contains 
// properties for actorId and similarityScore.
test('getTopActorMatches returns valid actor matches for custom profile image', async () => {
    // Set the user's profile image using a custom image buffer.
    const dummyImage = Buffer.from('dummy image data for custom profile');
    const resCustom = await uploadProfileImage('testuser', dummyImage);
    expect(resCustom.success).toBe(true);
    // Verify that the returned URL does not indicate the default image.
    expect(resCustom.url).not.toMatch(/default/i);
    
    // Now call getTopActorMatches for the test user.
    const resultCustom = await getTopActorMatches('testuser');
    // Expect the result to be an array.
    expect(Array.isArray(resultCustom)).toBe(true);
    // Expect no more than 5 actor matches.
    expect(resultCustom.length).toBeLessThanOrEqual(5);
    // If there are matches, ensure each match object contains the necessary properties.
    if (resultCustom.length > 0) {
        expect(resultCustom[0]).toHaveProperty('actorId');
        expect(resultCustom[0]).toHaveProperty('similarityScore');
    }
});

// ----------------------------------
// Test: linkActorToUser fails when profile image is default (no valid matches)
// ----------------------------------
// This test first sets the user's profile image to default (by passing null) so that getTopActorMatches
// returns an error, then attempts to link any actor. Since the user has the default image, the linkage should fail.
test('linkActorToUser fails for any actor if the profile image is default', async () => {
    // Set the user's profile image to default.
    const resDefault = await uploadProfileImage('testuser', null);
    expect(resDefault.success).toBe(true);
    // Verify that the URL indicates the default image.
    expect(resDefault.url).toMatch(/default/i);

    // Now, attempt to retrieve top actor matches; expect an error because the default image yields no embedding.
    const matchesDefault = await getTopActorMatches('testuser');
    expect(matchesDefault.error).toBeDefined();

    // Attempt to link an actor (even an arbitrary ID should fail in this state).
    const resInvalid = await linkActorToUser('testuser', 'invalidActorId');
    expect(resInvalid.success).toBe(false);
});

// ----------------------------------
// Test: linkActorToUser links valid actor with custom profile image
// ----------------------------------
// This test updates the user's profile image with a custom image buffer so that valid actor matches are generated.
// It then selects the first valid actor from the top 5 matches and attempts to link that actor to the user.
// The test expects the linkage to succeed.
test('linkActorToUser links valid actor from top 5 matches with custom profile image', async () => {
    // Set the user's profile image to a custom image.
    const dummyImage = Buffer.from('custom dummy image data');
    const resCustom = await uploadProfileImage('testuser', dummyImage);
    expect(resCustom.success).toBe(true);
    // Verify that the returned URL does not indicate the default image.
    expect(resCustom.url).not.toMatch(/default/i);
    
    // Retrieve top actor matches for the user.
    const matches = await getTopActorMatches('testuser');
    expect(Array.isArray(matches)).toBe(true);
    // Ensure there is at least one match.
    expect(matches.length).toBeGreaterThan(0);
    
    // Select the first valid actor from the matches.
    const validActorId = matches[0].actorId;
    // Attempt to link the actor. This should succeed if the actor is among the top five matches.
    const resValid = await linkActorToUser('testuser', validActorId);
    expect(resValid.success).toBe(true);
    
});


// ----------------------------------
// Test: getTopHashtags
// ----------------------------------
// Retrieves the top 10 hashtags and checks that the returned value is an array 
// with at most 10 items, sorted from greatest to least by count.
test('getTopHashtags returns a sorted array of up to 10 hashtags', async () => {
    const tags = await getTopHashtags();

    // Ensure it's an array with up to 10 elements
    expect(Array.isArray(tags)).toBe(true);
    expect(tags.length).toBeLessThanOrEqual(10);

    // Ensure each item has a 'count' property that is a number
    for (const tag of tags) {
        expect(typeof tag.count).toBe('number');
    }

    // Ensure the array is sorted in descending order by count
    for (let i = 0; i < tags.length - 1; i++) {
        expect(tags[i].count).toBeGreaterThanOrEqual(tags[i + 1].count);
    }
});
