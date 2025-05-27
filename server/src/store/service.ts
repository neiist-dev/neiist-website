import ExcelJS from "exceljs";
import type { OrderWithItems } from "./dto";
import { ordersRepository } from "./ordersRepository";
import { productsRepository } from "./productsRepository";

// Product functions remain the same
const getAllProducts = () => {
	return productsRepository.getAllProducts();
};

const getProductsByType = (type: string) => {
	return productsRepository.getProductsByType(type);
};

const getFeaturedProducts = () => {
	return productsRepository.getFeaturedProducts();
};

const getProductById = (id: string) => {
	return productsRepository.getProductById(id);
};

const getAvailableVariants = (productId: string) => {
	return productsRepository.getAvailableVariants(productId);
};

const checkVariantAvailability = (productId: string, size: string) => {
	return productsRepository.checkVariantAvailability(productId, size);
};

const deleteOrder = async (orderId: string) => {
	const order = await ordersRepository.getOrder(orderId);
	if (!order) {
		throw new Error("Order not found");
	}
	if (order.paid) {
		throw new Error("Cannot delete paid order");
	}
	if (order.delivered) {
		throw new Error("Cannot delete delivered order");
	}
	await ordersRepository.deleteOrder(orderId);
};

const checkProductAvailability = async (productId: string, size: string) => {
	try {
		const product = await productsRepository.getProductById(productId);

		if (!product) {
			throw new Error("Produto não encontrado");
		}

		// Verificar se o produto ainda está disponível para encomenda
		if (product.stockType === "onDemand") {
			const orderDeadline = new Date(product.orderInfo.orderDeadline);
			const now = new Date();

			if (now > orderDeadline) {
				throw new Error(
					`O período de encomenda terminou a ${orderDeadline.toLocaleDateString()}`,
				);
			}
		}

		// Verificar disponibilidade do tamanho
		const isAvailable = await productsRepository.checkVariantAvailability(
			productId,
			size,
		);

		if (!isAvailable) {
			throw new Error("Tamanho não disponível");
		}

		return {
			available: true,
			deadline:
				product.stockType === "onDemand"
					? product.orderInfo.orderDeadline
					: null,
			estimatedDelivery:
				product.stockType === "onDemand"
					? product.orderInfo.estimatedDelivery
					: "1-5 dias úteis",
		};
	} catch (error) {
		return {
			available: false,
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			error: (error as any).message,
		};
	}
};

const getDeliveryInfo = (productId: string) => {
	return productsRepository.getDeliveryInfo(productId);
};

const createOrder = async (orderData: OrderWithItems) => {
	if (!orderData.items || orderData.items.length === 0) {
		return {
			success: false,
			error: "O pedido deve ter pelo menos um item",
		};
	}

	if (
		!orderData.name ||
		!orderData.email ||
		!orderData.ist_id ||
		!orderData.campus
	) {
		return {
			success: false,
			error: "Campos obrigatórios em falta: nome, email, ist_id e campus",
		};
	}

	if (!orderData.total_amount) {
		orderData.total_amount = orderData.items.reduce(
			(sum, item) => sum + item.quantity * item.unit_price,
			0,
		);
	}

	const availabilityChecks = await Promise.all(
		orderData.items.map(async (item) => {
			const availability = await checkProductAvailability(
				item.product_id,
				item.size,
			);
			return {
				...availability,
				item: item,
			};
		}),
	);

	const unavailableItems = availabilityChecks.filter(
		(check) => !check.available,
	);
	if (unavailableItems.length > 0) {
		const errorMessages = unavailableItems
			.map(
				(item) => `${item.item.product_id} (${item.item.size}): ${item.error}`,
			)
			.join(", ");

		return {
			success: false,
			error: errorMessages,
			unavailableItems: unavailableItems.map((item) => ({
				productId: item.item.product_id,
				size: item.item.size,
			})),
		};
	}

	try {
		const orderId = await ordersRepository.createOrder(orderData);

		return {
			success: true,
			orderId,
			estimatedDelivery: availabilityChecks.some((item) => item.deadline)
				? "Conforme prazo informado no produto"
				: "1-5 dias úteis",
		};
	} catch (error) {
		return {
			success: false,
			error: "Erro ao criar pedido",
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			details: (error as any).message,
		};
	}
};

const getAllOrders = async () => {
	const orders = await ordersRepository.getAllOrders();
	return orders;
};

const getAllOrdersWithItems = async () => {
	const orders = await ordersRepository.getAllOrders();
	const orderPromises = orders.map(async (order) => {  
		try {  
			const items = await ordersRepository.getOrderItems(order.order_id);  
			return {  
				...order,  
				items: items,  
			};  
		} catch (error) {  
			console.error(`Failed to fetch items for order ${order.order_id}:`, error);  
			return {  
				...order,  
				items: [],  
			};  
		}  
	});  
	
	return await Promise.all(orderPromises);
};

const getOrderById = async (orderId: string) => {
	const order = await ordersRepository.getOrder(orderId);
	return order;
};

const getOrdersByCustomerName = async (name: string) => {
	const orders = await ordersRepository.getOrdersByCustomerName(name);
	return orders;
};

const getOrdersByEmail = async (email: string) => {
	const orders = await ordersRepository.getOrdersByEmail(email);
	return orders;
};

const getOrdersByPhone = async (phone: string) => {
	const orders = await ordersRepository.getOrdersByPhone(phone);
	return orders;
};

const getOrdersByIstId = async (istId: string) => {
	const orders = await ordersRepository.getOrdersByIstId(istId);
	return orders;
};

const getUnpaidOrders = async () => {
	const orders = await ordersRepository.getUnpaidOrders();
	return orders;
};

const getUndeliveredOrders = async () => {
	const orders = await ordersRepository.getUndeliveredOrders();
	return orders;
};

const markOrderAsPaid = async (orderId: string, paymentResponsible: string) => {
	const order = await ordersRepository.getOrder(orderId);

	if (!order) {
		throw new Error("Order not found");
	}

	if (order.paid) {
		// throw new Error("Order is already paid");
	}

	await ordersRepository.markOrderAsPaid(orderId, paymentResponsible);
};

const markOrderAsNotPaid = async (orderId: string) => {
	const order = await ordersRepository.getOrder(orderId);

	if (!order) {
		throw new Error("Order not found");
	}

	if (order.paid) {
		// throw new Error("Order is already paid");
	}

	await ordersRepository.markOrderAsNotPaid(orderId);
};

const markOrderAsDelivered = async (
	orderId: string,
	deliveryResponsible: string,
) => {
	const order = await ordersRepository.getOrder(orderId);

	if (!order) {
		throw new Error("Order not found");
	}

	if (!order.paid) {
		// throw new Error("Cannot deliver unpaid order");
	}

	if (order.delivered) {
		// throw new Error("Order is already delivered");
	}

	await ordersRepository.markOrderAsDelivered(orderId, deliveryResponsible);
};

const markOrderAsNotDelivered = async (orderId: string) => {
	const order = await ordersRepository.getOrder(orderId);

	if (!order) {
		throw new Error("Order not found");
	}

	if (!order.paid) {
		// throw new Error("Cannot deliver unpaid order");
	}

	if (order.delivered) {
		// throw new Error("Order is already delivered");
	}

	await ordersRepository.markOrderAsNotDelivered(orderId);
};

const getOrderItems = async (orderId: string) => {
	const order = await ordersRepository.getOrder(orderId);

	if (!order) {
		throw new Error("Order not found");
	}

	const items = await ordersRepository.getOrderItems(orderId);
	return items;
};

const exportExcel = async (orders: OrderWithItems[]) => {
	try {
		if (!orders?.length) {
			throw new Error("No orders to export");
		}

		const workbook = new ExcelJS.Workbook();
		const alamedaSheet = workbook.addWorksheet("Encomendas Alameda");
		const tagusSheet = workbook.addWorksheet("Encomendas Tagus");
		const itemsSheet = workbook.addWorksheet("Items");

		const alamedaOrders = orders.filter(
			(order) => order.campus.toLowerCase() === "alameda",
		);
		const tagusOrders = orders.filter(
			(order) => order.campus.toLowerCase() === "taguspark",
		);

		const columns = [
			{ header: "Order ID", key: "order_id", width: 15 },
			{ header: "Name", key: "name", width: 30 },
			{ header: "NIF", key: "nif", width: 15 },
			{ header: "Email", key: "email", width: 35 },
			{ header: "Phone", key: "phone", width: 15 },
			{ header: "IST ID", key: "ist_id", width: 12 },
			{
				header: "Total Amount",
				key: "total_amount",
				width: 15,
				style: { numFmt: "€#,##0.00" },
			},
			{ header: "Paid", key: "paid", width: 10 },
			{ header: "Delivered", key: "delivered", width: 12 },
			{ header: "Payment Responsible", key: "payment_responsible", width: 20 },
			{
				header: "Delivery Responsible",
				key: "delivery_responsible",
				width: 20,
			},
			{ header: "Notes", key: "notes", width: 90 },
		];

		const itemColumns = [
			{ header: "Order ID", key: "order_id", width: 15 },
			{ header: "Product ID", key: "product_id", width: 15 },
			{ header: "Size", key: "size", width: 10 },
			{ header: "Quantity", key: "quantity", width: 10 },
			{
				header: "Unit Price",
				key: "unit_price",
				width: 15,
				style: { numFmt: "€#,##0.00" },
			},
			{
				header: "Total",
				key: "total",
				width: 15,
				style: { numFmt: "€#,##0.00" },
			},
			{ header: "Customer Name", key: "customer_name", width: 30 },
			{ header: "Campus", key: "campus", width: 15 },
		];

		alamedaSheet.columns = columns;
		tagusSheet.columns = columns;
		itemsSheet.columns = itemColumns;

		// biome-ignore lint/complexity/noForEach: <explanation>
		alamedaOrders.forEach((order) => {
			alamedaSheet.addRow({
				order_id: order.order_id,
				name: order.name,
				nif: order.nif || "",
				email: order.email,
				phone: order.phone || "",
				ist_id: order.ist_id,
				total_amount: order.total_amount,
				paid: order.paid ? "Yes" : "No",
				delivered: order.delivered ? "Yes" : "No",
				payment_responsible: order.payment_responsible || "",
				delivery_responsible: order.delivery_responsible || "",
				notes: order.notes || "",
			});

			// biome-ignore lint/complexity/noForEach: <explanation>
			order.items?.forEach((item) => {
				itemsSheet.addRow({
					order_id: order.order_id,
					product_id: item.product_id,
					size: item.size,
					quantity: item.quantity,
					unit_price: item.unit_price,
					total: item.quantity * item.unit_price,
					customer_name: order.name,
					campus: order.campus,
				});
			});
		});

		// biome-ignore lint/complexity/noForEach: <explanation>
		tagusOrders.forEach((order) => {
			tagusSheet.addRow({
				order_id: order.order_id,
				name: order.name,
				nif: order.nif || "",
				email: order.email,
				phone: order.phone || "",
				ist_id: order.ist_id,
				total_amount: order.total_amount,
				paid: order.paid ? "Yes" : "No",
				delivered: order.delivered ? "Yes" : "No",
				payment_responsible: order.payment_responsible || "",
				delivery_responsible: order.delivery_responsible || "",
				notes: order.notes || "",
			});

			// biome-ignore lint/complexity/noForEach: <explanation>
			order.items?.forEach((item) => {
				itemsSheet.addRow({
					order_id: order.order_id,
					product_id: item.product_id,
					size: item.size,
					quantity: item.quantity,
					unit_price: item.unit_price,
					total: item.quantity * item.unit_price,
					customer_name: order.name,
					campus: order.campus,
				});
			});
		});

		// biome-ignore lint/complexity/noForEach: <explanation>
		[alamedaSheet, tagusSheet, itemsSheet].forEach((worksheet) => {
			worksheet.getRow(1).font = { bold: true };
			worksheet.getRow(1).fill = {
				type: "pattern",
				pattern: "solid",
				fgColor: { argb: "FFE0E0E0" },
			};

			worksheet.eachRow({ includeEmpty: true }, (row) => {
				row.eachCell({ includeEmpty: true }, (cell) => {
					cell.border = {
						top: { style: "thin" },
						left: { style: "thin" },
						bottom: { style: "thin" },
						right: { style: "thin" },
					};
				});
			});

			worksheet.autoFilter = {
				from: { row: 1, column: 1 },
				to: { row: 1, column: worksheet.columns.length },
			};
		});

		return await workbook.xlsx.writeBuffer();
	} catch (error) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		throw new Error(`Failed to generate Excel file: ${(error as any).message}`);
	}
};

export const storeService = {
	getAllProducts,
	getProductsByType,
	getFeaturedProducts,
	getProductById,
	getAvailableVariants,
	checkVariantAvailability,
	deleteOrder,
	getDeliveryInfo,
	createOrder,
	getAllOrders,
	getAllOrdersWithItems,
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
	exportExcel,
};
