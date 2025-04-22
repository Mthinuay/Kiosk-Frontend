// src/__tests__/ProductList.test.js
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import ProductList from "../ProductList"; // adjust path as needed

jest.mock("axios");

beforeAll(() => {
  global.localStorage.setItem = jest.fn();
  global.localStorage.getItem = jest.fn();
});

describe("ProductList Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays product listings correctly", async () => {
    const mockProducts = [
      { productID: 1, productName: "Product 1", description: "Description 1", price: 20, ImagePath: "/images/product1.jpg" },
      { productID: 2, productName: "Product 2", description: "Description 2", price: 30, ImagePath: "/images/product2.jpg" },
    ];
    axios.get.mockResolvedValue({ data: mockProducts });

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
      expect(screen.getByText("Product 2")).toBeInTheDocument();
    });
  });

  it("renders product grid responsively", async () => {
    const mockProducts = [
      { productID: 1, productName: "Product 1", description: "Description 1", price: 20, ImagePath: "/images/product1.jpg" },
    ];
    axios.get.mockResolvedValue({ data: mockProducts });

    render(<ProductList />);
    await waitFor(() => screen.getByText("Product 1"));

    const grid = screen.getByRole("grid");
    expect(grid).toHaveClass("grid");

    // Simulate screen resize (optional test logic)
    global.innerWidth = 500;
    global.dispatchEvent(new Event("resize"));
    expect(grid.className).toMatch(/grid-cols/);
  });

  it("shows 'Add Product' button for Super Users", async () => {
    global.localStorage.getItem.mockImplementation((key) => {
      if (key === "token") return "superuser_token";
      if (key === "role") return "SuperUser";
    });

    axios.get.mockResolvedValue({ data: [] });

    render(<ProductList />);
    expect(await screen.findByText("Add Product")).toBeInTheDocument();
  });

  it("does not show 'Add Product' button for regular users", async () => {
    global.localStorage.getItem.mockImplementation((key) => {
      if (key === "token") return "regularuser_token";
      if (key === "role") return "User";
    });

    axios.get.mockResolvedValue({ data: [] });

    render(<ProductList />);
    expect(screen.queryByText("Add Product")).toBeNull();
  });

  it("shows validation errors when submitting empty form", async () => {
    global.localStorage.getItem.mockImplementation((key) => {
      if (key === "token") return "superuser_token";
      if (key === "role") return "SuperUser";
    });

    axios.get.mockResolvedValue({ data: [] });

    render(<ProductList />);
    userEvent.click(screen.getByText("Add Product"));
    userEvent.click(screen.getByText("Submit Product"));

    expect(await screen.findByText("Product name is required")).toBeInTheDocument();
    expect(screen.getByText("Description is required")).toBeInTheDocument();
    expect(screen.getByText("Price is required")).toBeInTheDocument();
  });

  it("displays error message when API request fails", async () => {
    axios.get.mockRejectedValue(new Error("Network Error"));

    render(<ProductList />);
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });
  });
});
