const apiCall = async (endpoint) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      // Attempt to get error details from response
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message || `HTTP error! status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! status: ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API call failed:", error);
    throw error; // Propagate error to caller
  }
};

export const fetchCollabInformation = (username) =>
  apiCall(`/api/collabs/info/${username}`);
export const fetchAllCollabs = () => apiCall(`/api/collabs/all`);
export const fetchCollabsResume = () => apiCall(`/api/collabs/resume`);
export const fetchAllMembers = () => apiCall(`/api/mag/all`);
export const fetchActiveMembers = () => apiCall(`/api/mag/active`);
export const fetchMemberRenewalNotifications = () =>
  apiCall(`/api/mag/renewalNotifications`);
export const fetchMember = (username) => apiCall(`/api/members/${username}`);
export const fetchMemberStatus = (username) =>
  apiCall(`/api/members/status/${username}`);

export const fetchThesis = () => apiCall("/api/theses");
export const fetchThesisAreas = () => apiCall("/api/areas");
export const fetchElections = () => apiCall("/api/elections");
export const fetchAdminElections = () => apiCall(`/api/admin/elections`);

// Store endpoints
export const fetchProducts = async () => {
  try {
    const response = await apiCall("/api/store/products");

    // Since response is already the data, we don't need to call .json()
    const transformedData = Array.isArray(response)
      ? response.map((product) => ({
          id: product.id,
          name: product.displayName?.text || product.name,
          type: product.type,
          stockType: product.stockType,
          price: product.price,
          color: {
            name: product.color?.name,
            hex: product.color?.hex,
          },
          images: product.images || [],
          variants: product.variants || [],
          orderInfo: {
            estimatedDelivery: product.orderInfo?.estimatedDelivery,
            orderDeadline: product.orderInfo?.orderDeadline,
            minOrderQuantity: product.orderInfo?.minOrderQuantity || 1,
          },
          description: product.description,
          details: product.details,
          visible: product.visible,
        }))
      : [];
    return transformedData;
  } catch (error) {
    console.error("Error in fetchProducts:", error);
    throw new Error("Erro ao carregar produtos: " + error.message);
  }
};

export const fetchProductsByType = async (type) => {
  try {
    const products = await apiCall(`/api/store/products/type/${type}`);
    if (!Array.isArray(products)) {
      throw new Error("Invalid response format: expected array of products");
    }
    return products;
  } catch (error) {
    console.error("Failed to fetch products by type:", error);
    throw error;
  }
};

export const fetchProductById = (id) => apiCall(`/api/store/products/${id}`);

export const fetchFeaturedProducts = () =>
  apiCall("/api/store/products/featured");

export const fetchProductVariants = (productId) =>
  apiCall(`/api/store/products/${productId}/variants`);

export const checkProductAvailability = (productId, size) =>
  apiCall(`/api/store/products/${productId}/check-availability?size=${size}`);

export const getDeliveryInfo = (productId) =>
  apiCall(`/api/store/products/${productId}/delivery`);

export const createOrder = async (orderData) => {
  try {
    const response = await fetch("/api/store/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.error || `HTTP error! status: ${response.status}`
      );
    }

    return responseData;
  } catch (error) {
    console.error("Failed to create order:", error);
    throw error;
  }
};

export const fetchOrders = async () => {
  try {
    const orders = await apiCall("/api/store/orders");

    if (!Array.isArray(orders)) {
      throw new Error("Invalid response format: expected array of orders");
    }

    return orders;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
};

export const fetchOrdersByStatus = async (status) => {
  try {
    const orders = await apiCall(`/api/store/orders?status=${status}`);

    if (!Array.isArray(orders)) {
      throw new Error("Invalid response format: expected array of orders");
    }

    return orders;
  } catch (error) {
    console.error("Failed to fetch orders by status:", error);
    throw error;
  }
};

export const fetchOrdersByCustomerName = async (name) => {
  try {
    const orders = await apiCall(
      `/api/store/orders?customer_name=${encodeURIComponent(name)}`
    );

    if (!Array.isArray(orders)) {
      throw new Error("Invalid response format: expected array of orders");
    }

    return orders;
  } catch (error) {
    console.error("Failed to fetch orders by customer name:", error);
    throw error;
  }
};

export const fetchOrdersByEmail = async (email) => {
  try {
    const orders = await apiCall(
      `/api/store/orders?email=${encodeURIComponent(email)}`
    );

    if (!Array.isArray(orders)) {
      throw new Error("Invalid response format: expected array of orders");
    }

    return orders;
  } catch (error) {
    console.error("Failed to fetch orders by email:", error);
    throw error;
  }
};

export const fetchOrdersByPhone = async (phone) => {
  try {
    const orders = await apiCall(
      `/api/store/orders?phone=${encodeURIComponent(phone)}`
    );

    if (!Array.isArray(orders)) {
      throw new Error("Invalid response format: expected array of orders");
    }

    return orders;
  } catch (error) {
    console.error("Failed to fetch orders by phone:", error);
    throw error;
  }
};

export const fetchOrderById = async (orderId) => {
  try {
    const order = await apiCall(`/api/store/orders/${orderId}`);
    return order;
  } catch (error) {
    console.error(`Failed to fetch order ${orderId}:`, error);
    throw error;
  }
};

export const fetchOrderDetailsById = async (orderId) => {
  try {
    const orderDetails = await apiCall(`/api/store/orders/${orderId}/details`);
    return orderDetails;
  } catch (error) {
    console.error(`Failed to fetch order details for order ${orderId}:`, error);
    throw error;
  }
};

export const fetchAllOrdersDetails = async () => {
  try {
    const orders = await fetchOrders();
    if (!Array.isArray(orders)) {
      throw new Error("Invalid response format: expected array of orders");
    }

    const ordersDetails = await Promise.all(
      orders.map((order) => fetchOrderDetailsById(order.order_id))
    );

    return ordersDetails;
  } catch (error) {
    console.error("Failed to fetch all orders details:", error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, updates) => {
  try {
    const response = await fetch(`/api/store/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to update order status:", error);
    throw error;
  }
};

export const markOrderAsPaid = async (orderId, payment_responsible) => {
  return updateOrderStatus(orderId, {
    paid: true,
    payment_responsible,
  });
};

export const markOrderAsNotPaid = async (orderId, payment_responsible) => {
  return updateOrderStatus(orderId, {
    paid: false,
    payment_responsible,
  });
};

export const markOrderAsDelivered = async (orderId, delivery_responsible) => {
  return updateOrderStatus(orderId, {
    delivered: true,
    delivery_responsible,
  });
};

export const markOrderAsNotDelivered = async (
  orderId,
  delivery_responsible
) => {
  return updateOrderStatus(orderId, {
    delivered: false,
    delivery_responsible,
  });
};

export const cancelOrder = async (orderId) => {
  try {
    const response = await fetch(`/api/store/orders/${orderId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.error || `HTTP error! status: ${response.status}`
      );
    }

    return responseData;
  } catch (error) {
    console.error("Failed to cancel order:", error);
    throw error;
  }
};

export const generateExcel = async (orders) => {
  try {
    const response = await fetch("/api/store/orders/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orders),
    });

    if (!response.ok) throw new Error("Failed to generate excel");

    const blob = await response.blob();

    return blob; // Blob containing the Excel file to download
  } catch (error) {
    console.error("Failed to generate Excel:", error);
    throw error;
  }
};
