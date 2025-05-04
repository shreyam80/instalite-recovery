import React, { useState } from 'react';
import axios from 'axios';

const FeedPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('text_content', textContent);
    formData.append('hashtag_text', hashtags);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      await axios.post('/post/create', formData);
      alert('Post created!');
      setShowModal(false);
      setTextContent('');
      setHashtags('');
      setImageFile(null);
    } catch (err) {
      console.error(err);
      alert('Error creating post.');
    }
  };

  return (
    <>
      {/* Existing feed rendering logic goes here */}

      <button onClick={() => setShowModal(true)} style={{
        position: 'fixed', bottom: 30, right: 30, fontSize: '2rem', padding: '10px 20px',
      }}>➕</button>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, width: '300px' }}>
            <h2>Create a Post</h2>
            <form onSubmit={handlePostSubmit}>
              <textarea
                placeholder="What's on your mind?"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                style={{ width: '100%' }}
              />
              <input
                type="text"
                placeholder="Hashtags (comma-separated)"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                style={{ width: '100%', marginTop: '10px' }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                style={{ marginTop: '10px' }}
              />
              <div style={{ marginTop: 10 }}>
                <button type="submit">Post</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ marginLeft: 10 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedPage;
