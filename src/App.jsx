import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProductList from './components/ProductList';
import Login from './components/Login';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Toast notifications */}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

        <Routes>
          {/* Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Product List Route */}
          <Route
            path="/product-list"
            element={
              <>
                <h1 className="text-center text-3xl font-bold my-5">Product Listings</h1>
                <ProductList />
              </>
            }
          />

          {/* Redirect base path to login */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
