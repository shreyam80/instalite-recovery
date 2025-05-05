// src/components/ProfilePhotoUpload.jsx
import { useState } from 'react';

export default function ProfilePhotoUpload({ userId, onMatches }) {
  const [status, setStatus] = useState('');

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('Uploading and matching…');

    const form = new FormData();
    form.append('userId', userId);
    form.append('profileImage', file);

    try {
      const res = await fetch('http://localhost:3000/uploadProfileImage', {
        method: 'POST',
        body: form
      });
      if (!res.ok) throw new Error(await res.text());
      const { imageUrl, actorMatches } = await res.json();
      onMatches({ imageUrl, actorMatches });
      setStatus('Done!');
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
      setStatus('');
    }
  }

  return (
    <div>
      <h3>Pick a Profile Photo</h3>
      <input type="file" accept="image/*" onChange={handleFile} />
      {status && <p>{status}</p>}
    </div>
  );
}