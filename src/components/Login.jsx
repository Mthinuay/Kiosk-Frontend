import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // to navigate after login

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation to check if both fields are filled
    if (!email || !password) {
      setError('Please fill in both fields');
      return;
    }

    // Make a POST request to the backend to authenticate the user
    try {
      const response = await axios.post('https://localhost:7030/api/auth/login', { email, password });
      const { token } = response.data; // assuming the backend sends a JWT token

      // Save the token in localStorage
      localStorage.setItem('token', token);

      // Navigate to the product listing page (or any other page after login)
      navigate('/product-list');
    } catch (err) {
      // Show error if login fails
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-lg w-80">
        <h2 className="text-center text-2xl font-bold mb-6">Login</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 mt-2 border rounded"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-semibold">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mt-2 border rounded"
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
