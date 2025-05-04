import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    login: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    birthday: "",
    affiliation: "",
    profile_image_url: "",   // still a string
    hashtag_text: ""         // ← string, not array
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // split on commas (ignoring empty strings)
    const hashtags =
      formData.hashtag_text
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    // build the body, drop profile_image_url if empty
    const body = {
      login: formData.login,
      password: formData.password,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      affiliation: formData.affiliation,
      birthday: formData.birthday,
      hashtags
    };
    if (formData.profile_image_url.trim()) {
      body.profileImageUrl = formData.profile_image_url.trim();
    }

    try {
      const res = await fetch("http://localhost:3030/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("Register error payload:", data);
        setError(data.error || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      navigate("/profile");
    } catch (err) {
      console.error("Register exception:", err);
      setError("Something went wrong");
    }
  };

  return (
    <div className="auth-form">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          name="login"
          placeholder="Username"
          value={formData.login}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
        />

        <input
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="birthday"
          placeholder="Birthday"
          value={formData.birthday}
          onChange={handleChange}
          required
        />

        <input
          name="affiliation"
          placeholder="Affiliation"
          value={formData.affiliation}
          onChange={handleChange}
        />

        <input
          name="profile_image_url"
          placeholder="Profile Image URL (optional)"
          value={formData.profile_image_url}
          onChange={handleChange}
        />

        <input
          name="hashtag_text"
          placeholder="Hashtags (comma-separated)"
          value={formData.hashtag_text}
          onChange={handleChange}
        />

        {error && <div className="error">{error}</div>}

        <button type="submit">Register</button>
      </form>

      <button onClick={() => navigate("/login")}>Back to Login</button>
    </div>
  );
}