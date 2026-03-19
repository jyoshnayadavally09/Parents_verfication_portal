import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [rollNumber, setRollNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("counsellor@university.edu");
  const [password, setPassword] = useState("counsellor123");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    if (!rollNumber || !phone) {
      alert("Enter roll number and parent phone number.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/send-otp`, { rollNumber, phone });
      alert(response.data.message);
      if (response.data.success) {
        setShowOtp(true);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      alert("Enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/verify-otp`, {
        rollNumber,
        phone,
        otp
      });

      alert(response.data.message);
      if (response.data.success) {
        localStorage.setItem("userRole", "student");
        localStorage.setItem("studentRollNumber", rollNumber);
        localStorage.setItem("parentPhone", phone);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const loginCounsellor = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/counsellor/login`, { email, password });
      if (response.data.success) {
        localStorage.setItem("userRole", "counsellor");
        localStorage.setItem("counsellorEmail", email);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Unable to login as counsellor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-container">
        <div className="left-panel">
          <div className="eyebrow">AI Powered Student Portal</div>
          <h1>StudyTracker</h1>
          <p>
            Monitor attendance, fees, assignments, calendar events, placement readiness,
            counsellor notes, and AI-generated academic guidance from one place.
          </p>

          <div className="feature-stack">
            <div className="feature-card">
              <strong>Voice assistant</strong>
              <span>Ask attendance, CGPA, pending assignments, or fee questions.</span>
            </div>
            <div className="feature-card">
              <strong>Early risk alerts</strong>
              <span>Low attendance and backlog warnings are surfaced automatically.</span>
            </div>
            <div className="feature-card">
              <strong>Counsellor workspace</strong>
              <span>Review around 72 students with insights, remarks, and readiness status.</span>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="role-switch">
            <button
              className={role === "student" ? "active" : ""}
              onClick={() => setRole("student")}
              type="button"
            >
              Student Login
            </button>
            <button
              className={role === "counsellor" ? "active" : ""}
              onClick={() => setRole("counsellor")}
              type="button"
            >
              Counsellor Login
            </button>
          </div>

          {role === "student" ? (
            <>
              <h2>Student Access</h2>
              <p className="subtitle">
                Use roll number and parent phone verification to open the academic dashboard.
              </p>
              <input
                className="input"
                placeholder="Roll Number"
                value={rollNumber}
                onChange={(event) => setRollNumber(event.target.value)}
              />
              <input
                className="input"
                placeholder="Parent Phone Number"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <button className="btn" onClick={sendOTP} disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>

              {showOtp && (
                <div className="otp-block">
                  <input
                    className="input"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                  />
                  <button className="btn" onClick={verifyOTP} disabled={loading}>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <h2>Counsellor Access</h2>
              <p className="subtitle">
                Demo credentials are prefilled. You can also override them with your own env-based values.
              </p>
              <input
                className="input"
                placeholder="Counsellor Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <input
                className="input"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button className="btn" onClick={loginCounsellor} disabled={loading}>
                {loading ? "Signing in..." : "Login as Counsellor"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
