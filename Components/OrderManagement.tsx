import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, User, Loader2, Edit3, X } from "lucide-react";

/**
 * OrdersTrackingDashboard.tsx
 * Edited to add: edit order modal so user can change payment status and order status after creation.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://backend-template-58uoqaq4r-srs-projects-c448f20f.vercel.app";

type OrderStatus = "Pending" | "Delivered" | "Cancelled";
type PaymentStatus = "Unpaid" | "Paid" | "Refunded";

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface OrderApiResponse {
  id: string | number;
  ownerId?: string | number;
  customerName: string;
  purchasedItems?: string | null;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderDate?: string | null;
  deliveryDate?: string | null;
  paymentDate?: string | null;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // if backend returns items, accept them
  items?: any[];
  totalAmount?: number;
}

interface Order {
  id: number;
  purchasedItems?: string;
  customerName: string;
  items?: OrderItem[];
  totalAmount?: number;
  orderDate?: string | null;
  deliveryDate?: string | null;
  paymentDate?: string | null;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  remarks?: string | null;
  ownerId?: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock?: number;
  imageUrl?: string;
}

const OrdersTrackingDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Add-order form state
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const [newOrderCustomerName, setNewOrderCustomerName] = useState("");
  const [newOrderStatus, setNewOrderStatus] = useState<OrderStatus>("Pending");
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>("Unpaid");
  const [newOrderDate, setNewOrderDate] = useState<string>("");
  const [newDeliveryDate, setNewDeliveryDate] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  const [globalLoading, setGlobalLoading] = useState(false);

  const productSelectRef = useRef<HTMLSelectElement | null>(null);

  // Edit modal state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus | "">("");
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus | "">("");
  const [editLoading, setEditLoading] = useState(false);

  // Helpers to read items from localStorage in a defensive way
  const getAuthToken = (): string | null => {
    try {
      return (
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwtToken") ||
        localStorage.getItem("auth") ||
        localStorage.getItem("session") ||
        null
      );
    } catch {
      return null;
    }
  };

  const getUserFromLocalStorage = (): any => {
    try {
      const userStr = localStorage.getItem("user") || localStorage.getItem("userSession");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  // Generic API fetch helper (throws on non-2xx)
  const apiFetch = async <T,>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    if (!res.ok) {
      // try to parse body for message
      try {
        const body = await res.json();
        throw new Error(body?.message || `HTTP ${res.status}`);
      } catch {
        throw new Error(`HTTP ${res.status}`);
      }
    }
    // try to parse JSON; if empty, return null
    const text = await res.text();
    return text ? JSON.parse(text) : (null as unknown as T);
  };

  // Initialize token and user on mount
  useEffect(() => {
    const t = getAuthToken();
    const u = getUserFromLocalStorage();
    setToken(t);
    setUser(u);
  }, []);

  // Keep token / user in sync with storage events (useful for auth flows)
  useEffect(() => {
    const onStorage = () => {
      setToken(getAuthToken());
      setUser(getUserFromLocalStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Fetch products (normalized) — this is defensive and idempotent
  const fetchProducts = async (force = false) => {
    const effectiveToken = token ?? getAuthToken();
    if (!effectiveToken) {
      setProductsError("Not authenticated");
      setProducts([]);
      return;
    }
    // Avoid unnecessary refetch unless forced
    if (!force && products.length > 0) return;

    setProductsLoading(true);
    setProductsError(null);
    try {
      const raw = await apiFetch<any[]>("/api/products", effectiveToken);
      // Accept array or wrapper { products: [...] }
      const list: any[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.products) ? (raw as any).products : [];

      const normalized: Product[] = list.map((p: any) => ({
        // normalize id and price -> numbers
        id: Number(p.id ?? p.product_id ?? p.productId),
        name: String(p.name ?? p.title ?? ""),
        price: Number(p.price ?? 0),
        stock: p.stock != null ? Number(p.stock) : undefined,
        imageUrl: p.imageUrl ?? p.image_url ?? undefined,
      })).filter(px => !Number.isNaN(px.id)); // drop invalid
      setProducts(normalized);
      console.debug("Products loaded:", normalized);
    } catch (err) {
      console.error("Failed to fetch products", err);
      setProductsError(err instanceof Error ? err.message : String(err));
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch orders (normalizes server response)
  const fetchOrders = async () => {
    const effectiveToken = token ?? getAuthToken();
    if (!effectiveToken) {
      setOrdersError("Not authenticated");
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const raw = await apiFetch<OrderApiResponse[]>('/api/orders', effectiveToken);
      const data = Array.isArray(raw) ? raw : [];
      const normalized: Order[] = data.map((r) => {
        const idNum = Number(r.id ?? (r as any).orderId);
        return {
          id: Number.isNaN(idNum) ? 0 : idNum,
          customerName: r.customerName,
          purchasedItems: r.purchasedItems ?? undefined,
          orderDate: r.orderDate ?? null,
          deliveryDate: r.deliveryDate ?? null,
          paymentDate: r.paymentDate ?? null,
          orderStatus: (r.orderStatus as OrderStatus) ?? "Pending",
          paymentStatus: (r.paymentStatus as PaymentStatus) ?? "Unpaid",
          remarks: r.remarks ?? undefined,
          totalAmount: r.totalAmount != null ? Number(r.totalAmount) : undefined,
          items: Array.isArray(r.items)
            ? r.items.map((it: any) => ({
                productId: Number(it.productId ?? it.product_id),
                name: it.name ?? it.productName ?? `Product ${it.productId ?? it.product_id}`,
                price: Number(it.unitPrice ?? it.unit_price ?? it.price ?? 0),
                quantity: Number(it.quantity ?? 0),
                totalPrice: Number(it.totalPrice ?? it.total_price ?? 0),
              }))
            : undefined,
        } as Order;
      });
      setOrders(normalized);
      console.debug("Orders loaded:", normalized);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      setOrdersError(err instanceof Error ? err.message : String(err));
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch when token becomes available
  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchOrders();
    }
  }, [token]);

  // Open Add modal: ensure products are loaded (force fetch if empty)
  useEffect(() => {
    if (showAdd && token) {
      // Force fetch to ensure up-to-date products when modal opens
      fetchProducts(true);
    }
  }, [showAdd, token]);

  // Controlled select handler — value comes in as string from DOM, convert defensively
  const handleSelectProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedProductId(null);
      setSelectedPrice(0);
      setSelectedProductName("");
      setQuantity(1);
      return;
    }
    const productId = Number(val);
    if (Number.isNaN(productId)) {
      console.error("Invalid product id selected:", val);
      return;
    }

    // products are normalized with numeric id -> simple find
    const product = products.find((p) => p.id === productId);
    if (!product) {
      console.error("Product not found for id:", productId, "available ids:", products.map(p => p.id));
      // clear selection to keep UI consistent
      setSelectedProductId(null);
      setSelectedPrice(0);
      setSelectedProductName("");
      return;
    }

    setSelectedProductId(product.id);
    setSelectedPrice(Number(product.price || 0));
    setSelectedProductName(product.name || "");
    setQuantity(1);
  };

  const lineTotal = useMemo(() => {
    const safeQty = Math.max(1, Number(quantity || 1));
    return Number((selectedPrice || 0) * safeQty);
  }, [selectedPrice, quantity]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value || 1);
    setQuantity(Math.max(1, Number.isNaN(val) ? 1 : val));
  };

  const resetAddOrderForm = () => {
    setSelectedProductId(null);
    setSelectedPrice(0);
    setSelectedProductName("");
    setQuantity(1);
    setNewOrderCustomerName("");
    setNewOrderStatus("Pending");
    setNewPaymentStatus("Unpaid");
    setNewOrderDate("");
    setNewDeliveryDate("");
    setRemarks("");
    if (productSelectRef.current) productSelectRef.current.value = "";
  };

 const handleAddNewOrder = async () => {
  const effectiveToken = token ?? getAuthToken();
  if (!effectiveToken) return alert("Authentication required.");
  if (!newOrderCustomerName.trim()) return alert("Customer name is required.");
  if (!selectedProductId) return alert("Please select a product.");
  if (quantity <= 0) return alert("Quantity must be at least 1.");

  // defensive re-find product in case products changed since selection
  const product = products.find((p) => p.id === selectedProductId);
  if (!product) {
    alert("Selected product is not available. Please choose another product.");
    return;
  }

  console.log("🔍 Selected Product:", product);
  console.log("🔍 Quantity:", quantity, "Type:", typeof quantity);

  setGlobalLoading(true);
  try {
    const itemPrice = Number(product.price || 0);
    const itemTotal = Number((itemPrice * quantity).toFixed(2));

    // Payload structured for your server - items should only have productId and quantity
    const payload = {
      customerName: newOrderCustomerName.trim(),
      orderDate: newOrderDate || new Date().toISOString().split("T")[0],
      deliveryDate: newDeliveryDate || null,
      orderStatus: newOrderStatus,
      paymentStatus: newPaymentStatus,
      remarks: remarks.trim(),
      items: [
        {
          productId: Number(product.id),  // Server only needs productId
          quantity: Number(quantity)       // and quantity (it fetches price from DB)
        }
      ],
      purchasedItems: `${product.name} (${quantity}x @ $${itemPrice.toFixed(2)})`,
    };

    console.log("📤 Sending Payload:", JSON.stringify(payload, null, 2));

    const created = await apiFetch<OrderApiResponse>("/api/orders", effectiveToken, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log("✅ Order Created:", created);

    // Server returns order (may include items). Compose a UI-friendly object:
    const createdId = Number(created?.id ?? (created as any)?.orderId ?? Date.now());
    const newOrder: Order = {
      id: Number.isNaN(createdId) ? Date.now() : createdId,
      customerName: created.customerName || newOrderCustomerName,
      purchasedItems: created.purchasedItems ?? payload.purchasedItems,
      orderDate: created.orderDate ?? payload.orderDate,
      deliveryDate: created.deliveryDate ?? payload.deliveryDate,
      paymentDate: created.paymentDate ?? undefined,
      orderStatus: (created.orderStatus as OrderStatus) || newOrderStatus,
      paymentStatus: (created.paymentStatus as PaymentStatus) || newPaymentStatus,
      remarks: created.remarks ?? remarks,
      items: Array.isArray(created.items) ? created.items.map((it: any) => ({
        productId: Number(it.productId ?? it.product_id),
        name: it.name ?? it.productName ?? product.name,
        price: Number(it.unitPrice ?? it.unit_price ?? it.price ?? itemPrice),
        quantity: Number(it.quantity ?? it.qty ?? quantity),
        totalPrice: Number(it.totalPrice ?? it.total_price ?? itemTotal),
      })) : [{
        productId: product.id,
        name: product.name,
        price: itemPrice,
        quantity,
        totalPrice: itemTotal,
      }],
      totalAmount: created.totalAmount != null ? Number(created.totalAmount) : itemTotal,
    };

    setOrders((prev) => [newOrder, ...prev]);
    resetAddOrderForm();
    setShowAdd(false);
    alert("Order added successfully!");
  } catch (err) {
    console.error("Add order failed:", err);
    alert(err instanceof Error ? err.message : "Failed to add order");
  } finally {
    setGlobalLoading(false);
  }
};
  // ----------------- EDIT/UPDATE logic -----------------
  const openEdit = (order: Order) => {
    setEditingOrder(order);
    setEditPaymentStatus((order.paymentStatus ?? "Unpaid") as PaymentStatus);
    setEditOrderStatus((order.orderStatus ?? "Pending") as OrderStatus);
  };

  const closeEdit = () => {
    setEditingOrder(null);
    setEditLoading(false);
    setEditPaymentStatus("");
    setEditOrderStatus("");
  };

  const applyPaymentChange = async (orderId: number, newStatus: PaymentStatus) => {
    const effectiveToken = token ?? getAuthToken();
    if (!effectiveToken) throw new Error("Authentication required");
    setEditLoading(true);
    try {
      const resp = await apiFetch<any>(`/api/orders/${orderId}/payment`, effectiveToken, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      // update local orders collection
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: newStatus, paymentDate: resp.paymentDate ?? o.paymentDate } : o));
      return resp;
    } finally {
      setEditLoading(false);
    }
  };

  const applyOrderStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    const effectiveToken = token ?? getAuthToken();
    if (!effectiveToken) throw new Error("Authentication required");
    setEditLoading(true);
    try {
      const resp = await apiFetch<any>(`/api/orders/${orderId}/status`, effectiveToken, {
        method: "PATCH",
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus, deliveryDate: resp.deliveryDate ?? o.deliveryDate } : o));
      return resp;
    } finally {
      setEditLoading(false);
    }
  };

  const saveEdits = async () => {
    if (!editingOrder) return;
    const orderId = editingOrder.id;
    setEditLoading(true);
    try {
      // Apply payment first if changed
      if (editPaymentStatus && editPaymentStatus !== editingOrder.paymentStatus) {
        await applyPaymentChange(orderId, editPaymentStatus as PaymentStatus);
      }
      // Apply order status if changed
      if (editOrderStatus && editOrderStatus !== editingOrder.orderStatus) {
        await applyOrderStatusChange(orderId, editOrderStatus as OrderStatus);
      }

      // refresh orders to ensure consistency
      await fetchOrders();
      closeEdit();
      alert("Order updated successfully.");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setEditLoading(false);
    }
  };

  const filteredOrders = useMemo(() => orders, [orders]);

  // ----------------- RENDER -----------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-8 h-8 text-blue-600" /> Orders Tracking
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchOrders(); fetchProducts(true); }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => { setShowAdd(true); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Order
            </button>
          </div>
        </div>

        <div className="flex items-center mb-6 gap-2 bg-white rounded-lg border border-gray-300 px-3 py-2 shadow-sm">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Filter by customer or product..."
            className="w-full outline-none"
            onChange={() => {}}
            disabled
            value=""
            title="Client-side filtering disabled in this build; implement if desired"
          />
        </div>

        {(ordersLoading && !showAdd) ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
          </div>
        ) : ordersError ? (
          <div className="text-red-600 text-center bg-red-50 border border-red-200 rounded-lg p-4">{ordersError}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{order.customerName}</h3>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-blue-600">${(order.totalAmount ?? 0).toFixed(2)}</div>
                    <button title="Edit order" onClick={() => openEdit(order)} className="p-2 rounded hover:bg-gray-100"><Edit3 className="w-4 h-4"/></button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mt-3 mb-4">
                  {order.items && order.items.length > 0 ? (
                    <ul className="space-y-2">
                      {order.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <div>
                            <div className="font-medium text-gray-800">{it.name}</div>
                            <div className="text-xs text-gray-500">${(it.price).toFixed(2)} × {it.quantity}</div>
                          </div>
                          <div className="font-semibold text-gray-800">${(it.totalPrice).toFixed(2)}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">{order.purchasedItems ?? "—"}</p>
                  )}
                </div>

                <div className="space-y-1 text-sm border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${order.orderStatus === "Delivered" ? "text-green-600" : order.orderStatus === "Cancelled" ? "text-red-600" : "text-yellow-600"}`}>{order.orderStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment:</span>
                    <span className={`font-medium ${order.paymentStatus === "Paid" ? "text-green-600" : order.paymentStatus === "Refunded" ? "text-orange-600" : "text-red-600"}`}>{order.paymentStatus}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Order: {order.orderDate ?? "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Delivery: {order.deliveryDate ?? "—"}</span>
                  </div>
                  {order.remarks && (
                    <p className="text-xs italic text-gray-600 mt-2 bg-yellow-50 p-2 rounded">{order.remarks}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add order modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <h3 className="text-xl font-bold text-gray-800">Add New Order</h3>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={newOrderCustomerName}
                    onChange={(e) => setNewOrderCustomerName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product <span className="text-red-500">*</span>
                  </label>

                  {productsLoading ? (
                    <div className="text-sm text-gray-500 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" /> Loading products...
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-sm text-gray-500 border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">
                      No products available. Check API/auth.
                    </div>
                  ) : (
                    <div>
                      <select
                        ref={productSelectRef}
                        value={selectedProductId !== null ? String(selectedProductId) : ""}
                        onChange={handleSelectProduct}
                        className="w-full border-2 border-gray-400 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer text-base"
                      >
                        <option value="">-- Select a product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.name} — ${Number(p.price).toFixed(2)}
                          </option>
                        ))}
                      </select>

                      {selectedProductId !== null && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                          <div className="font-medium text-green-800 text-sm">✓ Selected: {selectedProductName}</div>
                          <div className="text-green-600 text-xs mt-1">
                            Product ID: {selectedProductId} | Unit Price: ${selectedPrice.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price</label>
                    <div className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold text-lg">
                      {selectedPrice > 0 ? `$${selectedPrice.toFixed(2)}` : "$0.00"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-800">Line Total:</span>
                    <span className="text-3xl font-bold text-blue-600">${lineTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {selectedPrice > 0 && quantity > 0 && (
                      <span>${selectedPrice.toFixed(2)} × {quantity} = ${lineTotal.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                    <select
                      value={newOrderStatus}
                      onChange={(e) => setNewOrderStatus(e.target.value as OrderStatus)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                    <select
                      value={newPaymentStatus}
                      onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Date</label>
                    <input
                      type="date"
                      value={newOrderDate || ""}
                      onChange={(e) => setNewOrderDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                    <input
                      type="date"
                      value={newDeliveryDate || ""}
                      onChange={(e) => setNewDeliveryDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional)</label>
                  <textarea
                    placeholder="Add any additional notes or remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdd(false);
                      resetAddOrderForm();
                    }}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleAddNewOrder}
                    disabled={globalLoading || productsLoading || selectedProductId === null}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                  >
                    {globalLoading ? "Saving..." : "Save Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EDIT modal */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Edit Order #{editingOrder.id}</h3>
                <button onClick={closeEdit} className="p-2 rounded hover:bg-gray-100"><X className="w-5 h-5"/></button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                  <div className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">{editingOrder.customerName}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                    <select value={editPaymentStatus} onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5">
                      <option value="">-- Keep current --</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                    <div className="text-xs text-gray-500 mt-1">Current: {editingOrder.paymentStatus}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                    <select value={editOrderStatus} onChange={(e) => setEditOrderStatus(e.target.value as OrderStatus)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5">
                      <option value="">-- Keep current --</option>
                      <option value="Pending">Pending</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <div className="text-xs text-gray-500 mt-1">Current: {editingOrder.orderStatus}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button onClick={closeEdit} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                  <button disabled={editLoading} onClick={saveEdits} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {editLoading ? "Saving..." : "Save changes"}
                  </button>
                </div>

                <div className="text-xs text-gray-500">Note: changing payment to Paid will mark payment_date on server. Refunds are manual and must be processed by admin.</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OrdersTrackingDashboard;
