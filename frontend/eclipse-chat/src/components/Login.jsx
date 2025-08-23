import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from './Modal';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });
    

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password.length < 6) {
            showModal(
                'Password Too Short',
                'Password must be at least 6 characters long.',
                'error'
            );
            return;
        }

        try {
            const res = await fetch("http://localhost:5001/api/auth/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                showModal('Login Failed', data.error || 'Something went wrong.', 'error');
                return;
            }

            // Store JWT for later API calls
            localStorage.setItem("token", data.token);

            showModal(
                'Login Successful!',
                'Welcome back! You have been successfully logged into your private world.',
                'success'
            );

            // Redirect after a short delay
            setTimeout(() => {
                navigate("/chats");
            }, 2000);

        } catch (err) {
            console.error("Login error:", err);
            showModal('Network Error', 'Unable to connect to server. Try again later.', 'error');
        }
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

            <Modal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </div>
    );
};

export default Login;
