import { useState } from 'react';
import { Link} from 'react-router-dom';

import './authentication.css';


function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  // const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    // For now, just show success message
    console.log('Sign up data:', formData);
    alert('Account created successfully!');
  };

  return (
    <div className="auth-container">
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
              required/>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required/>
                  <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required/>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required/>
            <button type="submit">Sign Up</button>
            <p>Already have an account? <Link to="/login">Log in</Link></p>
          </form>
        </div>
        <a href="/">Back to Home</a>
    </div>
  );
}

export default SignUp;