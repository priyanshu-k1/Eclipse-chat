import { useState } from 'react';
import { Link,useNavigate  } from 'react-router-dom';
import Modal from '../components/Modal';
import './authentication.css';

function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const showModal = (title, message, type = 'info') => {
    setModal({
      isOpen: true,
      title,
      message,
      type
    });
  };
  const closeModal = () => {
    setModal({
      ...modal,
      isOpen: false
    });
  };
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!formData.username.trim()) {
      showModal('Validation Error','Username is required!', 'error');
      setIsLoading(false);
      return;
    }
    if (formData.username.trim().length < 3) {
      showModal('Validation Error', 'Username must be at least 3 characters long!', 'error');
      setIsLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      showModal('Validation Error', 'Email is required!', 'error');
      setIsLoading(false);
      return;
    }
    if (!validateEmail(formData.email.trim())) {
      showModal('Validation Error', 'Please enter a valid email address!', 'error');
      setIsLoading(false);
      return;
    }
    if (!formData.password) {
      showModal('Validation Error', 'Password is required!', 'error');
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      showModal('Weak Password', 'Password must be at least 6 characters long!', 'error');
      setIsLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showModal('Password Mismatch', 'Passwords do not match!', 'error');
      setIsLoading(false);
      return;
    }
    const signupData = {
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };
    console.log('Sending signup data:', signupData); 
    try {
      const res = await fetch("http://localhost:5001/api/auth/signup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(signupData),
      });
      console.log('Response status:', res.status); 
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const textResponse = await res.text();
        console.log('Non-JSON response:', textResponse);
        throw new Error(`Server returned non-JSON response: ${textResponse}`);
      }
      if (res.ok) {
        showModal('Success!', data.message || 'Account created successfully!', 'success');
        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: ""
        });
        localStorage.setItem('token', data.token);
        setTimeout(() => {
          navigate("/chats");
        }, 1500);
      } else {
        let errorMessage = 'Signup failed';
        if (data.error) {
          errorMessage = data.error;
        } else if (res.status === 400) {
          errorMessage = data.message || 'Invalid input data';
        } else if (res.status === 401) {
          errorMessage = data.error || 'Authentication failed';
        } else if (res.status >= 500) {
          errorMessage = 'Server error, please try again later';
        } else {
          errorMessage = data.message || `Error ${res.status}: ${res.statusText}`;
        }
        
        showModal('Signup Failed', errorMessage, 'error');
      }
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = 'Network error, please try again later.';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Make sure the server is running on http://localhost:5001';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Server returned an invalid response. Check server logs.';
      }
      
      showModal('Connection Error', errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="stars">
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
      </div>
      <div className="card">
        <h2>Create Your Secure Space</h2>
        <p>Because your privacy matters.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter your username"
            disabled={isLoading}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            disabled={isLoading}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            disabled={isLoading}
            required
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            disabled={isLoading}
            required
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
          <p>Already have an account? <Link to="/login">Log in</Link></p>
        </form>
      </div>
      <a href="/LandingPage">Back to Home</a>

      {/* Modal Component */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}

export default SignUp;