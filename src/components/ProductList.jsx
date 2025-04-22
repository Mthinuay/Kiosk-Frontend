import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    price: "",
    categoryID: "",
    quantity: "",
    imageFile: null,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const exp = decoded.exp * 1000;
        if (Date.now() >= exp) {
          localStorage.removeItem("token");
          setUserRole(null);
          toast.warn("Session expired. Please log in again.");
        } else {
          const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
          setUserRole(decoded[roleClaim]);
        }
      } catch (err) {
        console.error("Invalid token:", err);
        setUserRole(null);
      }
    }
  }, [token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get("https://localhost:7030/api/products"),
        axios.get("https://localhost:7030/api/category"),
      ]);
      console.log("Fetched products:", productsRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : files ? files[0] : value,
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.productName.trim()) {
      errors.productName = "Product name is required";
    } else if (formData.productName.length > 100) {
      errors.productName = "Product name cannot exceed 100 characters";
    }
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length > 300) {
      errors.description = "Description cannot exceed 300 characters";
    }
    if (!formData.categoryID.trim()) {
      errors.categoryID = "Category is required";
    }
    if (!formData.price) {
      errors.price = "Price is required";
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = "Price must be greater than 0";
    }
    if (!formData.quantity) {
      errors.quantity = "Quantity is required";
    } else if (!Number.isInteger(Number(formData.quantity)) || parseInt(formData.quantity) < 0) {
      errors.quantity = "Quantity must be a non-negative integer";
    }
    if (!formData.imageFile) {
      errors.imageFile = "Product image is required";
    } else if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(formData.imageFile.type)) {
      errors.imageFile = "Only JPG, PNG, or WebP images are allowed";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = new FormData();
    for (const key in formData) {
      payload.append(key.charAt(0).toUpperCase() + key.slice(1), formData[key]);
    }

    try {
      setSubmitting(true);
      const response = await axios.post("https://localhost:7030/api/products", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setProducts((prev) => [...prev, response.data]);
      toast.success("Product added successfully!");
      setShowForm(false);
      setFormData({
        productName: "",
        description: "",
        price: "",
        categoryID: "",
        quantity: "",
        imageFile: null,
      });
    } catch (error) {
      handleApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`https://localhost:7030/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.filter((p) => p.productID !== productId));
      toast.info("Product deleted.");
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleApiError = (error) => {
    if (!error.response) {
      toast.error("Network error. Please check your connection.");
      setError("Network error.");
      return;
    }

    const status = error.response.status;
    const message = error.response.data?.message || error.response.statusText;

    if (status >= 400 && status < 500) {
      toast.error(`Client error: ${message}`);
      setError(message);
    } else if (status >= 500) {
      toast.error(`Server error: ${message}`);
      setError(message);
    } else {
      toast.error("An unexpected error occurred.");
      setError("Unexpected error.");
    }
  };

  if (loading) return <p>Loading products...</p>;

  return (
    <div className="p-4">
      <ToastContainer />

      {userRole === "SuperUser" && (
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "Add Product"}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleFormSubmit} className="mb-6 grid gap-4 max-w-xl bg-white p-4 border rounded shadow">
          {/* Input Fields... (unchanged from your version) */}
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-gray-600 text-center">No products to display.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.productID} className="border p-4 rounded shadow-md">
              <img
                src={`https://localhost:7030${product.imagePath}`}
                alt={product.productName}
                className="w-full h-48 object-cover mb-4 rounded"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150";
                }}
              />
              <h3 className="font-bold text-xl mb-2">{product.productName}</h3>
              <p className="text-gray-700 mb-2">{product.description}</p>
              <p className="font-semibold text-green-700">${product.price}</p>
              {userRole === "SuperUser" && (
                <button
                  onClick={() => handleDeleteProduct(product.productID)}
                  className="mt-2 text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
