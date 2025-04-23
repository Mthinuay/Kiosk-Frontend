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
  const [editingProduct, setEditingProduct] = useState(null);

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
          const roleClaim =
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
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

    if (!formData.productName || formData.productName.trim() === "") {
      errors.productName = "Product name is required";
    } else if (formData.productName.length > 100) {
      errors.productName = "Product name cannot exceed 100 characters";
    }

    if (!formData.description || formData.description.trim() === "") {
      errors.description = "Description is required";
    } else if (formData.description.length > 300) {
      errors.description = "Description cannot exceed 300 characters";
    }

    if (!formData.categoryID) {
      errors.categoryID = "Category is required";
    }

    if (!formData.price) {
      errors.price = "Price is required";
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = "Price must be greater than 0";
    }

    if (userRole === "SuperUser") {
      if (!formData.quantity && formData.quantity !== 0) {
        errors.quantity = "Quantity is required";
      } else if (
        !Number.isInteger(Number(formData.quantity)) ||
        parseInt(formData.quantity) < 0
      ) {
        errors.quantity = "Quantity must be a non-negative integer";
      }
    }

    if (!formData.productID && !editingProduct) {
      if (!formData.imageFile) {
        errors.imageFile = "Product image is required";
      } else if (
        !["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(
          formData.imageFile.type
        )
      ) {
        errors.imageFile = "Only JPG, PNG, or WebP images are allowed";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = new FormData();
    payload.append("ProductName", formData.productName);
    payload.append("Description", formData.description);
    payload.append("CategoryID", String(formData.categoryID));
    payload.append("Price", String(formData.price));
    if (userRole === "SuperUser") {
      payload.append("Quantity", String(formData.quantity));
    }
    if (formData.imageFile || !editingProduct) {
      payload.append("Image", formData.imageFile);
    }

    // Log FormData for debugging
    for (const pair of payload.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    try {
      setSubmitting(true);
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      if (editingProduct) {
        payload.append("ProductID", String(editingProduct.productID));
        try {
        const response = await axios.put(
          `https://localhost:7030/api/products/${editingProduct.productID}`,
          payload,
          config
        );
        setProducts((prev) =>
          prev.map((product) =>
            product.productID === response.data.productID
              ? response.data
              : product
          )
        );

        //Optionally, set the form data to the updated product
        setShowForm(false);
        setFormData({
          productName: "",
          description: "",
          price: "",
          categoryID: "",
          quantity: "",
          imageFile: null,
        });
        setEditingProduct(null);
        toast.success("Product updated successfully!");
      } catch (error) {
        handleApiError(error);
      } 
    }else {
        const response = await axios.post(
          "https://localhost:7030/api/products",
          payload,
          config
        );
        setProducts((prev) => [...prev, response.data]);
        toast.success("Product added successfully!");
      }

      setShowForm(false);
      setFormData({
        productName: "",
        description: "",
        price: "",
        categoryID: "",
        quantity: "",
        imageFile: null,
      });
      setEditingProduct(null);
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
    console.error("Error details:", error);

    if (!error.response) {
      toast.error("Network error. Please check your connection.");
      setError("Network error.");
      return;
    }

    const status = error.response.status;
    const data = error.response.data;
    const message = data?.message || JSON.stringify(data) || error.response.statusText;

  
    if (status === 400) {
      toast.error(`Bad request: ${message}`);
      setError(`Bad Request: ${message}`);
    }
    else if (status >= 400 && status < 500) {
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

  const handleEditProduct = (productId) => {
    const product = products.find((p) => p.productID === productId);
    setFormData({
      productName: product.productName,
      description: product.description,
      price: product.price,
      categoryID: product.categoryID,
      quantity: product.quantity,
      imageFile: null,
    });
    setEditingProduct(product);
    setShowForm(true);
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
        <form
          onSubmit={handleFormSubmit}
          className="mb-6 grid gap-4 max-w-xl bg-white p-4 border rounded shadow"
        >
          <label className="block">
            Product Name
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              className="border p-2 w-full rounded"
            />
            {formErrors.productName && (
              <p className="text-red-500 text-sm">{formErrors.productName}</p>
            )}
          </label>

          <label className="block">
            Description
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="border p-2 w-full rounded"
            />
            {formErrors.description && (
              <p className="text-red-500 text-sm">{formErrors.description}</p>
            )}
          </label>

          <label className="block">
            Price
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="border p-2 w-full rounded"
            />
            {formErrors.price && (
              <p className="text-red-500 text-sm">{formErrors.price}</p>
            )}
          </label>

          <label className="block">
            Category
            <select
              name="categoryID"
              value={formData.categoryID}
              onChange={handleInputChange}
              className="border p-2 w-full rounded"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.categoryID} value={category.categoryID}>
                  {category.categoryName}
                </option>
              ))}
            </select>
            {formErrors.categoryID && (
              <p className="text-red-500 text-sm">{formErrors.categoryID}</p>
            )}
          </label>

          {userRole === "SuperUser" && (
            <label className="block">
              Quantity
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="border p-2 w-full rounded"
                min="0"
              />
              {formErrors.quantity && (
                <p className="text-red-500 text-sm">{formErrors.quantity}</p>
              )}
            </label>
          )}

          <label className="block">
            Image
            <input
              type="file"
              name="imageFile"
              accept="image/jpeg, image/png, image/jpg, image/webp"
              onChange={handleInputChange}
              className="border p-2 w-full rounded"
            />
            {formErrors.imageFile && (
              <p className="text-red-500 text-sm">{formErrors.imageFile}</p>
            )}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {editingProduct ? "Update Product" : "Add Product"}
          </button>
        </form>
      )}

      {products.length === 0 ? (
        <p className="text-gray-600 text-center">No products to display.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.productID}
              className="border p-4 rounded shadow-md"
            >
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
              <p className="font-semibold text-green-700">
               R{parseFloat(product.price).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                </p>
              {userRole === "SuperUser" && (
                <div className="mt-2">
                  <button
                    onClick={() => handleEditProduct(product.productID)}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.productID)}
                    className="mt-2 text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
