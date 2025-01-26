const express = require("express");
const { storeService } = require("../services");

const storeRoute = express.Router();

storeRoute.use(express.json());

/**
 * Get all products
 * GET /store/products
 */
storeRoute.get("/products", (req, res) => {
  try {
    const { available } = req.query;
    let products = storeService.getAllProducts();

    if (available === "true") {
      products = storeService.getAllAvalilableProducts();
    }

    if (!products || products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    res.json(products);
  } catch (error) {
    console.error("Error in products route:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * Get products by type
 * GET /store/products/type/:type
 */
storeRoute.get("/products/type/:type", (req, res) => {
  try {
    const { type } = req.params;

    if (!type) {
      return res.status(400).json({ error: "Product type is required" });
    }

    const products = storeService.getProductsByType(type);

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ error: `No products found for type: ${type}` });
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products by type" });
  }
});

/**
 * Get featured products
 * GET /store/products/featured
 */
storeRoute.get("/products/featured", (req, res) => {
  try {
    const products = storeService.getFeaturedProducts();

    if (!products || products.length === 0) {
      return res.status(404).json({ error: "No featured products found" });
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch featured products" });
  }
});

/**
 * Get specific product
 * GET /store/products/:id
 */
storeRoute.get("/products/:id", (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const product = storeService.getProductById(id);

    if (!product) {
      return res
        .status(404)
        .json({ error: `Product not found with ID: ${id}` });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

/**
 * Get available variants for a product
 * GET /store/products/:id/variants
 */
storeRoute.get("/products/:id/variants", (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const variants = storeService.getAvailableVariants(id);

    if (!variants || variants.length === 0) {
      return res
        .status(404)
        .json({ error: `No variants found for product ID: ${id}` });
    }

    res.json(variants);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product variants" });
  }
});

/**
 * Check product availability
 * GET /store/products/:id/check-availability
 */
storeRoute.get("/products/:id/check-availability", (req, res) => {
  try {
    const { id } = req.params;
    const { size } = req.query;

    if (!id || !size) {
      return res
        .status(400)
        .json({ error: "Product ID and size are required" });
    }

    const isAvailable = storeService.checkVariantAvailability(id, size);
    res.json({ available: isAvailable });
  } catch (error) {
    res.status(500).json({ error: "Failed to check product availability" });
  }
});

/**
 * Get delivery information
 * GET /store/products/:id/delivery
 */
storeRoute.get("/products/:id/delivery", (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const deliveryInfo = storeService.getDeliveryInfo(id);

    if (!deliveryInfo) {
      return res.status(404).json({
        error: `Delivery information not found for product ID: ${id}`,
      });
    }

    res.json(deliveryInfo);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch delivery information" });
  }
});

/**
 * Create new order
 * POST /store/orders
 */
storeRoute.post("/orders", async (req, res) => {
  try {
    const orderData = req.body;

    if (
      !orderData ||
      !orderData.items ||
      !orderData.name ||
      !orderData.email ||
      !orderData.ist_id ||
      !orderData.campus
    ) {
      return res.status(400).json({
        error:
          "Invalid order data. Required fields: items and customer information",
      });
    }

    const plainOrderData = JSON.parse(JSON.stringify(orderData));

    const createdOrder = await storeService.createOrder(plainOrderData);

    const plainResponse = {
      message: "Order created successfully",
      orderId: createdOrder ? String(createdOrder) : undefined,
    };

    res.status(201).json(plainResponse);
  } catch (error) {
    console.error("Error creating order:", {
      message: error.message,
      name: error.name,
    });

    const errorResponse = {
      error: error.message || "Failed to create order",
    };

    res.status(500).json(errorResponse);
  }
});

/**
 * Get all orders
 * GET /store/orders
 */
storeRoute.get("/orders", async (req, res) => {
  try {
    const { name, email, phone, ist_id, unpaid, undelivered } = req.query;

    let orders;
    if (unpaid === "true") {
      orders = await storeService.getUnpaidOrders();
    } else if (undelivered === "true") {
      orders = await storeService.getUndeliveredOrders();
    } else if (name) {
      orders = await storeService.getOrdersByCustomerName(name);
    } else if (email) {
      orders = await storeService.getOrdersByEmail(email);
    } else if (phone) {
      orders = await storeService.getOrdersByPhone(phone);
    } else if (ist_id) {
      orders = await storeService.getOrdersByIstId(ist_id);
    } else {
      orders = await storeService.getAllOrders();
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: "No orders found" });
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * Get specific order
 * GET /store/orders/:id
 */
storeRoute.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const order = await storeService.getOrderById(id);

    if (!order) {
      return res.status(404).json({ error: `Order not found with ID: ${id}` });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

/**
 * Get complete order details including items
 * GET /store/orders/:id/details
 */
storeRoute.get("/orders/:id/details", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const order = await storeService.getOrderById(id);

    if (!order) {
      return res.status(404).json({ error: `Order not found with ID: ${id}` });
    }

    const items = await storeService.getOrderItems(id);

    const orderDetails = {
      ...order,
      items: items,
      payment_info: {
        paid: order.paid,
        payment_responsible: order.payment_responsible,
        payment_timestamp: order.payment_timestamp,
      },
      delivery_info: {
        delivered: order.delivered,
        delivery_responsible: order.delivery_responsible,
        delivery_timestamp: order.delivery_timestamp,
      },
      timestamps: {
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
    };

    res.json(orderDetails);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

/**
 * Create new order
 * POST /store/orders
 */
storeRoute.post("/orders", async (req, res) => {
  try {
    const orderData = req.body;

    if (
      !orderData ||
      !orderData.items ||
      !orderData.name ||
      !orderData.email ||
      !orderData.ist_id ||
      !orderData.campus
    ) {
      return res.status(400).json({
        error:
          "Invalid order data. Required fields: items, name, email, ist_id, and campus",
      });
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({
        error: "Order must contain at least one item",
      });
    }

    for (const item of orderData.items) {
      if (
        !item.product_id ||
        !item.size ||
        !item.quantity ||
        !item.unit_price
      ) {
        return res.status(400).json({
          error:
            "Each item must have product_id, size, quantity, and unit_price",
        });
      }
    }

    const orderId = await storeService.createOrder(orderData);

    res.status(201).json({
      message: "Order created successfully",
      orderId: orderId,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message || "Failed to create order" });
  }
});

/**
 * Mark order as paid
 * POST /store/orders/:id/pay
 */
storeRoute.post("/orders/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_responsible } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    if (!payment_responsible) {
      return res.status(400).json({ error: "Payment responsible is required" });
    }

    await storeService.markOrderAsPaid(id, payment_responsible);

    res.json({
      message: "Order marked as paid successfully",
      orderId: id,
    });
  } catch (error) {
    console.error("Error marking order as paid:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to mark order as paid" });
  }
});

/**
 * Mark order as delivered
 * POST /store/orders/:id/deliver
 */
storeRoute.post("/orders/:id/deliver", async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_responsible } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    if (!delivery_responsible) {
      return res
        .status(400)
        .json({ error: "Delivery responsible is required" });
    }

    await storeService.markOrderAsDelivered(id, delivery_responsible);

    res.json({
      message: "Order marked as delivered successfully",
      orderId: id,
    });
  } catch (error) {
    console.error("Error marking order as delivered:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to mark order as delivered" });
  }
});

/**
 * Update order status
 * PATCH /store/orders/:id/status
 */
storeRoute.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { paid, delivered, payment_responsible, delivery_responsible } =
      req.body;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const order = await storeService.getOrderById(id);
    if (!order) {
      return res.status(404).json({ error: `Order not found with ID: ${id}` });
    }

    if (paid == true && payment_responsible) {
      await storeService.markOrderAsPaid(id, payment_responsible);
    }

    if (paid == false && payment_responsible) {
      await storeService.markOrderAsNotPaid(id, payment_responsible);
    }

    if (delivered == true && delivery_responsible) {
      await storeService.markOrderAsDelivered(id, delivery_responsible);
    }

    if (delivered == false && delivery_responsible) {
      await storeService.markOrderAsNotDelivered(id, delivery_responsible);
    }

    res.json({
      message: "Order status updated successfully",
      orderId: id,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to update order status" });
  }
});

/**
 * Delete order
 * DELETE /store/orders/:id
 */
storeRoute.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    await storeService.deleteOrder(id);

    res.json({
      message: "Order deleted successfully",
      orderId: id,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: error.message || "Failed to delete order" });
  }
});

/**
 * Export orders to Excel
 * POST /store/orders/export
 */
storeRoute.post("/orders/export", async (req, res) => {
  try {
    const orders = req.body;

    if (!orders || orders.length === 0) {
      return res.status(400).json({ error: "No orders to export" });
    }

    const xls = await storeService.exportExcel(orders);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=entrega-merch-neiist.xlsx"
    );
    res.send(Buffer.from(xls));
  } catch (error) {
    console.error("Error exporting orders:", error);
    res.status(500).json({ error: error.message || "Failed to export orders" });
  }
});

module.exports = storeRoute;
