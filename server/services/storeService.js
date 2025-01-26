const { productsDatabase, ordersDatabase } = require("../database");

// Product functions remain the same
const getAllProducts = () => {
  return productsDatabase.getAllProducts();
};

const getAllAvalilableProducts = () => {
  return productsDatabase.getAllAvalilableProducts();
};

const getProductsByType = (type) => {
  return productsDatabase.getProductsByType(type);
};

const getFeaturedProducts = () => {
  return productsDatabase.getFeaturedProducts();
};

const getProductById = (id) => {
  return productsDatabase.getProductById(id);
};

const getAvailableVariants = (productId) => {
  return productsDatabase.getAvailableVariants(productId);
};

const checkVariantAvailability = (productId, size) => {
  return productsDatabase.checkVariantAvailability(productId, size);
};

const getDeliveryInfo = (productId) => {
  return productsDatabase.getDeliveryInfo(productId);
};

const createOrder = async (orderData) => {
  if (!orderData.items || orderData.items.length === 0) {
    throw new Error("Order must have at least one item");
  }

  if (
    !orderData.name ||
    !orderData.email ||
    !orderData.ist_id ||
    !orderData.campus
  ) {
    throw new Error("Required fields missing: name, email, ist_id, and campus");
  }

  if (!orderData.total_amount) {
    orderData.total_amount = orderData.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
  }

  const orderId = await ordersDatabase.createOrder(orderData);
  return orderId;
};

const getAllOrders = async () => {
  const orders = await ordersDatabase.getAllOrders();
  return orders;
};

const getOrderById = async (orderId) => {
  const order = await ordersDatabase.getOrder(orderId);
  return order;
};

const getOrdersByCustomerName = async (name) => {
  const orders = await ordersDatabase.getOrdersByCustomerName(name);
  return orders;
};

const getOrdersByEmail = async (email) => {
  const orders = await ordersDatabase.getOrdersByEmail(email);
  return orders;
};

const getOrdersByPhone = async (phone) => {
  const orders = await ordersDatabase.getOrdersByPhone(phone);
  return orders;
};

const getOrdersByIstId = async (istId) => {
  const orders = await ordersDatabase.getOrdersByIstId(istId);
  return orders;
};

const getUnpaidOrders = async () => {
  const orders = await ordersDatabase.getUnpaidOrders();
  return orders;
};

const getUndeliveredOrders = async () => {
  const orders = await ordersDatabase.getUndeliveredOrders();
  return orders;
};

const markOrderAsPaid = async (orderId, paymentResponsible) => {
  const order = await ordersDatabase.getOrder(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paid) {
    // throw new Error("Order is already paid");
  }

  await ordersDatabase.markOrderAsPaid(orderId, paymentResponsible);
};

const markOrderAsNotPaid = async (orderId, paymentResponsible) => {
  const order = await ordersDatabase.getOrder(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paid) {
    // throw new Error("Order is already paid");
  }

  await ordersDatabase.markOrderAsNotPaid(orderId, paymentResponsible);
};

const markOrderAsDelivered = async (orderId, deliveryResponsible) => {
  const order = await ordersDatabase.getOrder(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.paid) {
    // throw new Error("Cannot deliver unpaid order");
  }

  if (order.delivered) {
    // throw new Error("Order is already delivered");
  }

  await ordersDatabase.markOrderAsDelivered(orderId, deliveryResponsible);
};

const markOrderAsNotDelivered = async (orderId, deliveryResponsible) => {
  const order = await ordersDatabase.getOrder(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.paid) {
    // throw new Error("Cannot deliver unpaid order");
  }

  if (order.delivered) {
    // throw new Error("Order is already delivered");
  }

  await ordersDatabase.markOrderAsNotDelivered(orderId, deliveryResponsible);
};

const getOrderItems = async (orderId) => {
  const order = await ordersDatabase.getOrder(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  const items = await ordersDatabase.getOrderItems(orderId);
  return items;
};

module.exports = {
  getAllProducts,
  getAllAvalilableProducts,
  getProductsByType,
  getFeaturedProducts,
  getProductById,
  getAvailableVariants,
  checkVariantAvailability,
  getDeliveryInfo,
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByCustomerName,
  getOrdersByEmail,
  getOrdersByPhone,
  getOrdersByIstId,
  getUnpaidOrders,
  getUndeliveredOrders,
  markOrderAsPaid,
  markOrderAsNotPaid,
  markOrderAsDelivered,
  markOrderAsNotDelivered,
  getOrderItems,
};
