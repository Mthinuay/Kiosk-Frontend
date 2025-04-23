import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true); // toggle between login/signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both fields');
      return;
    }

    try {
      const url = isLogin
        ? 'https://localhost:7030/api/auth/login'
        : 'https://localhost:7030/api/auth/register';
      const response = await axios.post(url, { email, password });

      if (isLogin) {
        const { token } = response.data;
        localStorage.setItem('token', token);
        navigate('/product-list');
      } else {
        setIsLogin(true); // after signup, go to login
      }
    } catch (err) {
      setError(err.response?.data || 'Something went wrong');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 dark:from-gray-900 dark:to-gray-800 transition-all duration-500">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-8 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in">
        <h2 className="text-3xl font-bold text-center mb-6">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold">Email</label>
            <input
              type="email"
              id="email"
              className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-700 bg-transparent rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold">Password</label>
            <input
              type="password"
              id="password"
              className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-700 bg-transparent rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition duration-300"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 hover:underline font-medium"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
