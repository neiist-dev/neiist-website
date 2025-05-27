import express from "express";
import { collaboratorMiddleware } from "../utils/middleware";
import type { Order } from "./dto";
import { storeService } from "./service";

export const storeRouter = express.Router();
storeRouter.use(express.json());

/**
 * Get all products
 * GET /store/products
 */
storeRouter.get("/products", (req, res) => {
	try {
		const products = storeService.getAllProducts();

		if (!products || products.length === 0) {
			res.status(404).json({ error: "No products found" });
			return;
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
storeRouter.get("/products/type/:type", (req, res) => {
	try {
		const { type } = req.params;

		if (!type) {
			res.status(400).json({ error: "Product type is required" });
			return;
		}

		const products = storeService.getProductsByType(type);

		if (!products || products.length === 0) {
			res.status(404).json({ error: `No products found for type: ${type}` });

			return;
		}

		res.json(products);
	} catch {
		res.status(500).json({ error: "Failed to fetch products by type" });
	}
});

/**
 * Get featured products
 * GET /store/products/featured
 */
storeRouter.get("/products/featured", (req, res) => {
	try {
		const products = storeService.getFeaturedProducts();

		if (!products || products.length === 0) {
			res.status(404).json({ error: "No featured products found" });
			return;
		}

		res.json(products);
	} catch {
		res.status(500).json({ error: "Failed to fetch featured products" });
	}
});

/**
 * Get specific product
 * GET /store/products/:id
 */
storeRouter.get("/products/:id", (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			res.status(400).json({ error: "Product ID is required" });
			return;
		}

		const product = storeService.getProductById(id);

		if (!product) {
			res.status(404).json({ error: `Product not found with ID: ${id}` });

			return;
		}

		res.json(product);
	} catch {
		res.status(500).json({ error: "Failed to fetch product" });
	}
});

/**
 * Get available variants for a product
 * GET /store/products/:id/variants
 */
storeRouter.get("/products/:id/variants", (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			res.status(400).json({ error: "Product ID is required" });
			return;
		}

		const variants = storeService.getAvailableVariants(id);

		if (!variants || variants.length === 0) {
			res
				.status(404)
				.json({ error: `No variants found for product ID: ${id}` });

			return;
		}

		res.json(variants);
	} catch {
		res.status(500).json({ error: "Failed to fetch product variants" });
	}
});

/**
 * Check product availability
 * GET /store/products/:id/check-availability
 */
storeRouter.get("/products/:id/check-availability", (req, res) => {
	try {
		const { id } = req.params;
		const { size } = req.query;

		if (!id || !size) {
			res.status(400).json({ error: "Product ID and size are required" });

			return;
		}

		const isAvailable = storeService.checkVariantAvailability(
			id,
			size as string,
		);
		res.json({ available: isAvailable });
	} catch {
		res.status(500).json({ error: "Failed to check product availability" });
	}
});

/**
 * Get delivery information
 * GET /store/products/:id/delivery
 */
storeRouter.get("/products/:id/delivery", (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			res.status(400).json({ error: "Product ID is required" });
			return;
		}

		const deliveryInfo = storeService.getDeliveryInfo(id);

		if (!deliveryInfo) {
			res.status(404).json({
				error: `Delivery information not found for product ID: ${id}`,
			});

			return;
		}

		res.json(deliveryInfo);
	} catch {
		res.status(500).json({ error: "Failed to fetch delivery information" });
	}
});

/**
 * Get all orders
 * GET /store/orders
 */
storeRouter.get("/orders", collaboratorMiddleware, async (req, res) => {
	try {
		const { name, email, phone, ist_id, unpaid, undelivered } = req.query;

		let orders: Order[];
		if (unpaid === "true") {
			orders = await storeService.getUnpaidOrders();
		} else if (undelivered === "true") {
			orders = await storeService.getUndeliveredOrders();
		} else if (name) {
			orders = await storeService.getOrdersByCustomerName(name as string);
		} else if (email) {
			orders = await storeService.getOrdersByEmail(email as string);
		} else if (phone) {
			orders = await storeService.getOrdersByPhone(phone as string);
		} else if (ist_id) {
			orders = await storeService.getOrdersByIstId(ist_id as string);
		} else {
			orders = await storeService.getAllOrders();
		}

		if (!orders || orders.length === 0) {
			res.json([]);
			return;
		}

		res.json(orders);
	} catch (error) {
		console.error("Error fetching orders:", error);
		res.status(500).json({ error: "Failed to fetch orders" });
	}
});

/**
 * Get all orders
 * GET /store/orders
 */
storeRouter.get("/orders", collaboratorMiddleware, async (req, res) => {
	try {
		const { name, email, phone, ist_id, unpaid, undelivered } = req.query;

		let orders: Order[];
		if (unpaid === "true") {
			orders = await storeService.getUnpaidOrders();
		} else if (undelivered === "true") {
			orders = await storeService.getUndeliveredOrders();
		} else if (name) {
			orders = await storeService.getOrdersByCustomerName(name as string);
		} else if (email) {
			orders = await storeService.getOrdersByEmail(email as string);
		} else if (phone) {
			orders = await storeService.getOrdersByPhone(phone as string);
		} else if (ist_id) {
			orders = await storeService.getOrdersByIstId(ist_id as string);
		} else {
			orders = await storeService.getAllOrders();
		}

		if (!orders || orders.length === 0) {
			res.json([]);
			return;
		}

		res.json(orders);
	} catch (error) {
		console.error("Error fetching orders:", error);
		res.status(500).json({ error: "Failed to fetch orders" });
	}
});

/**
 * Get all orders
 * GET /store/orders/details
 */
storeRouter.get("/orders/details", collaboratorMiddleware, async (req, res) => {
	try {
		let orders = await storeService.getAllOrdersWithItems();

		if (!orders || orders.length === 0) {
			res.json([]);
			return;
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
storeRouter.get("/orders/:id", collaboratorMiddleware, async (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			res.status(400).json({ error: "Order ID is required" });
			return;
		}

		const order = await storeService.getOrderById(id);

		if (!order) {
			res.status(404).json({ error: `Order not found with ID: ${id}` });
			return;
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
storeRouter.get(
	"/orders/:id/details",
	collaboratorMiddleware,
	async (req, res) => {
		try {
			const { id } = req.params;

			if (!id) {
				res.status(400).json({ error: "Order ID is required" });
				return;
			}

			const order = await storeService.getOrderById(id);

			if (!order) {
				res.status(404).json({ error: `Order not found with ID: ${id}` });
				return;
			}

			const items = await storeService.getOrderItems(id);

			const orderDetails = {
				...order,
				items,
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
	},
);

/**
 * Create new order
 * POST /store/orders
 */
storeRouter.post("/orders", async (req, res) => {
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
			res.status(400).json({
				error:
					"Invalid order data. Required fields: items, name, email, ist_id, and campus",
			});
			return;
		}

		if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
			res.status(400).json({
				error: "Order must contain at least one item",
			});
			return;
		}

		for (const item of orderData.items) {
			if (
				!item.product_id ||
				!item.size ||
				!item.quantity ||
				!item.unit_price
			) {
				res.status(400).json({
					error:
						"Each item must have product_id, size, quantity, and unit_price",
				});
				return;
			}
		}

		const orderReq = await storeService.createOrder(orderData);
		if (!orderReq) {
			throw new Error("Failed to create order, empty response");
		}

		if (orderReq.success === false) {
			throw new Error(orderReq.error || "Failed to create order");
		}

		const orderId = orderReq.orderId;

		res.status(201).json({
			message: "Order created successfully",
			orderId: orderId,
		});
	} catch (error) {
		console.error("Error creating order:", error);
		res
			.status(500)
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			.json({ error: (error as any).message || "Failed to create order" });
	}
});

/**
 * Mark order as paid
 * POST /store/orders/:id/pay
 */
storeRouter.post(
	"/orders/:id/pay",
	collaboratorMiddleware,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { payment_responsible } = req.body;

			if (!id) {
				res.status(400).json({ error: "Order ID is required" });
				return;
			}

			if (!payment_responsible) {
				res.status(400).json({ error: "Payment responsible is required" });
				return;
			}

			await storeService.markOrderAsPaid(id, payment_responsible);

			res.json({
				message: "Order marked as paid successfully",
				orderId: id,
			});
		} catch (error) {
			console.error("Error marking order as paid:", error);
			res.status(500).json({
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				error: (error as any).message || "Failed to mark order as paid",
			});
		}
	},
);

/**
 * Mark order as delivered
 * POST /store/orders/:id/deliver
 */
storeRouter.post(
	"/orders/:id/deliver",
	collaboratorMiddleware,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { delivery_responsible } = req.body;

			if (!id) {
				res.status(400).json({ error: "Order ID is required" });
				return;
			}

			if (!delivery_responsible) {
				res.status(400).json({ error: "Delivery responsible is required" });
				return;
			}

			await storeService.markOrderAsDelivered(id, delivery_responsible);

			res.json({
				message: "Order marked as delivered successfully",
				orderId: id,
			});
		} catch (error) {
			console.error("Error marking order as delivered:", error);
			res.status(500).json({
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				error: (error as any).message || "Failed to mark order as delivered",
			});
		}
	},
);

/**
 * Update order status
 * PATCH /store/orders/:id/status
 */
storeRouter.patch(
	"/orders/:id/status",
	collaboratorMiddleware,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { paid, delivered, payment_responsible, delivery_responsible } =
				req.body;

			if (!id) {
				res.status(400).json({ error: "Order ID is required" });
				return;
			}

			const order = await storeService.getOrderById(id);
			if (!order) {
				res.status(404).json({ error: `Order not found with ID: ${id}` });
				return;
			}

			if (paid === true && payment_responsible) {
				await storeService.markOrderAsPaid(id, payment_responsible);
			}

			if (paid === false && payment_responsible) {
				await storeService.markOrderAsNotPaid(id);
			}

			if (delivered === true && delivery_responsible) {
				await storeService.markOrderAsDelivered(id, delivery_responsible);
			}

			if (delivered === false && delivery_responsible) {
				await storeService.markOrderAsNotDelivered(id);
			}

			res.json({
				message: "Order status updated successfully",
				orderId: id,
			});
		} catch (error) {
			console.error("Error updating order status:", error);
			res.status(500).json({
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				error: (error as any).message || "Failed to update order status",
			});
		}
	},
);

/**
 * Delete order
 * DELETE /store/orders/:id
 */
storeRouter.delete("/orders/:id", collaboratorMiddleware, async (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			res.status(400).json({ error: "Order ID is required" });
			return;
		}

		await storeService.deleteOrder(id);

		res.json({
			message: "Order deleted successfully",
			orderId: id,
		});
	} catch (error) {
		console.error("Error deleting order:", error);

		res
			.status(500)
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			.json({ error: (error as any).message || "Failed to delete order" });
	}
});

/**
 * Export orders to Excel
 * POST /store/orders/export
 */
storeRouter.post("/orders/export", collaboratorMiddleware, async (req, res) => {
	try {
		const orders = req.body;

		if (!orders || orders.length === 0) {
			res.status(400).json({ error: "No orders to export" });
			return;
		}

		const xls = await storeService.exportExcel(orders);

		res.setHeader(
			"Content-Type",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
		res.setHeader(
			"Content-Disposition",
			"attachment; filename=entrega-merch-neiist.xlsx",
		);
		res.send(Buffer.from(xls));
	} catch (error) {
		console.error("Error exporting orders:", error);

		res
			.status(500)
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			.json({ error: (error as any).message || "Failed to export orders" });
	}
});
