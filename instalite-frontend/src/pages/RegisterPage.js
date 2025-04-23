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
    profile_image_url: "",
    hashtag_text: [],
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

    const body = {
      ...formData,
      hashtag_text: formData.hashtag_text.split(",").map((s) => s.trim()),
    };

    try {
      const res = await fetch("http://localhost:3030/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);

      navigate("/feed");
    } catch (err) {
      console.error("Register error:", err);
      setError("Something went wrong");
    }
  };

  return (
    <div className="auth-form">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input name="login" placeholder="Username" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <input name="email" placeholder="Email" onChange={handleChange} required />
        <input name="firstName" placeholder="First Name" onChange={handleChange} required />
        <input name="lastName" placeholder="Last Name" onChange={handleChange} required />
        <input name="birthday" placeholder="Birthday" onChange={handleChange} required />
        <input name="affiliation" placeholder="Affiliation" onChange={handleChange} />
        <input name="profile_image_url" placeholder="Profile Image URL" onChange={handleChange} />
        <input name="hashtag_text" placeholder="Hashtags (comma-separated)" onChange={handleChange} />
        {error && <div className="error">{error}</div>}
        <button type="submit">Register</button>
      </form>
      <button onClick={() => navigate("/login")}>Back to Login</button>
    </div>
  );
}
