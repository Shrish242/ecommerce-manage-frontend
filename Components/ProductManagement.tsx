// ProductManagement.tsx
import React, { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import type { Product } from "./types";

type ProductManagementProps = {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
};

const DEFAULT_PLACEHOLDER = "https://placehold.co/100x100/cbd5e1/000000?text=Prod";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://70.153.25.251:3001";

/** Normalize server product shape into frontend Product */
const mapServerToProduct = (srv: any): Product => {
  return {
    id: String(srv.id ?? srv.product_id ?? Date.now()),
    owner_id: srv.owner_id ?? srv.ownerId ?? undefined,
    name: srv.name ?? "",
    description: srv.description ?? "",
    price: Number(srv.price ?? 0),
    stock: Number(srv.stock ?? 0),
    ordersReceived: Number(srv.ordersReceived ?? srv.orders_received ?? 0),
    imageUrl: srv.imageUrl ?? srv.image_url ?? DEFAULT_PLACEHOLDER,
    created_at: srv.created_at ?? srv.createdAt ?? undefined,
    updated_at: srv.updated_at ?? srv.updatedAt ?? undefined,
    ...srv,
  } as Product;
};

const ProductManagement: React.FC<ProductManagementProps> = ({ products, setProducts }) => {
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<number | null>(null);

  // Read ownerId and token from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        const maybe = u.organization_id ?? u.organizationId ?? u.orgId ?? u.id;
        if (maybe) setOwnerId(Number(maybe));
      }
    } catch (err) {
      console.warn("Could not parse user from localStorage", err);
    }
  }, []);

  // Load products for this owner (authenticated)
  useEffect(() => {
    const load = async () => {
      if (!ownerId) return;
      const token = getAuthToken();
      if (!token) {
        console.warn("No auth token present; cannot load products.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/products`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          const txt = await res.text();
          console.warn("Failed to load products:", res.status, txt);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data.map(mapServerToProduct));
        }
      } catch (err) {
        console.error("Error loading products:", err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  function getAuthToken(): string | null {
    // ✨ FIX: Prioritize the explicit authToken key first.
    const t1 = localStorage.getItem("authToken");
    if (t1) return t1;
    
    // The previous logic is kept as a fallback for compatibility,
    // but the new login flow should always use 'authToken'.
    try {
      const auth = localStorage.getItem("auth") || localStorage.getItem("session");
      if (auth) {
        const parsed = JSON.parse(auth);
        return parsed?.token ?? parsed?.accessToken ?? null;
      }
    } catch (e) {
      // ignore parse errors
    }
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProduct((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      alert("Please fill Name, Price and Stock.");
      return;
    }
    if (!ownerId) {
      alert("Owner not found. Make sure you're logged in.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert("You must be logged in to add products.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", newProduct.name);
      fd.append("description", newProduct.description || "");
      fd.append("price", String(newProduct.price));
      fd.append("stock", String(newProduct.stock));
      if (file) fd.append("image", file);

      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      if (res.status === 401) {
        alert("Unauthorized. Please login again.");
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed: ${res.status}`);
      }

      const createdRaw = await res.json();
      const created = mapServerToProduct(createdRaw);

      setProducts((prev) => [...prev, created]);

      // Reset form
      setNewProduct({ name: "", description: "", price: "", stock: "" });
      setFile(null);
    } catch (err) {
      console.error("Add product error:", err);
      alert("Failed to add product: " + ((err as Error).message || ""));
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityStatus = (stock: number) => {
    if (stock > 50) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          In Stock
        </span>
      );
    } else if (stock > 0) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          Out of Stock
        </span>
      );
    }
  };

  return (
    <main className="flex-1 p-6 bg-gray-100 overflow-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Product Management</h2>

      {/* Add New Product Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <PlusCircle size={20} className="mr-2 text-indigo-600" /> Add New Product
        </h3>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={newProduct.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={newProduct.stock}
              onChange={handleInputChange}
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              Image (optional)
            </label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            ></textarea>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {/* All Products Grid */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">All Products</h3>
        {products.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No products added yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-gray-50 rounded-lg shadow-sm overflow-hidden border border-gray-200 p-4 flex flex-col items-center text-center"
              >
                <img
                  src={product.imageUrl ?? DEFAULT_PLACEHOLDER}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-md mb-3 border border-gray-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = DEFAULT_PLACEHOLDER;
                  }}
                />
                <h4 className="font-semibold text-gray-900 text-base mb-1 truncate w-full">{product.name}</h4>
                <p className="text-gray-700 text-sm mb-2">${Number(product.price ?? 0).toFixed(2)}</p>
                <div className="flex justify-between w-full text-sm text-gray-600 mb-2">
                  <span>Stock: {Number(product.stock ?? 0)}</span>
                  <span>Orders: {Number(product.ordersReceived ?? 0)}</span>
                </div>
                <div className="mt-auto">{getAvailabilityStatus(Number(product.stock ?? 0))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default ProductManagement;