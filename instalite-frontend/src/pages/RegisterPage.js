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
  const [passwordWarning, setPasswordWarning] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    symbol: false,
  });

  const navigate = useNavigate();

  function validatePassword(password) {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    };
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));

    if (name === "password") {
      setPasswordWarning(validatePassword(value));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const warnings = validatePassword(formData.password);
    const allValid = Object.values(warnings).every(Boolean);
    if (!allValid) {
      setError("Password does not meet security requirements.");
      return;
    }

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
        
        <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
          <strong>Password Requirements:</strong> Must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and one special character.
        </p>
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <ul className="password-rules">
          <li style={{ color: passwordWarning.length ? "green" : "red" }}>
            At least 8 characters
          </li>
          <li style={{ color: passwordWarning.upper ? "green" : "red" }}>
            Contains an uppercase letter
          </li>
          <li style={{ color: passwordWarning.lower ? "green" : "red" }}>
            Contains a lowercase letter
          </li>
          <li style={{ color: passwordWarning.number ? "green" : "red" }}>
            Contains a number
          </li>
          <li style={{ color: passwordWarning.symbol ? "green" : "red" }}>
            Contains a special character
          </li>
        </ul>

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