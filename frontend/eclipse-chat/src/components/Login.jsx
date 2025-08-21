import { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validation on submit
        if (formData.password.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }

        // For now, just show success message
        console.log('Login data:', formData);
        alert('Login successful!');
    };

    return (
        <div className="auth-container">
            <div className="card">
                <h2>Step Into Your Private World</h2>
                <p>Encrypted. Secure. Always yours.</p>
                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
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
                        required
                    />
                    <button type="submit">Log In</button>
                    <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
                </form>
                <a href="/">Back to Home</a>
            </div>
        </div>
    );
}

export default Login;