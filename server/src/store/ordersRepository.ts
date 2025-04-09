import type { PoolClient } from "pg";
import { PostgresError } from "pg-error-enum";
import { getClient, isDatabaseException, query } from "../utils/database";
import type { Order, OrderItem, OrderWithItems } from "./dto";

const deleteOrders = async () => {
	try {
		await query("DROP TABLE IF EXISTS order_items");
		await query("DROP TABLE IF EXISTS orders");
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const createOrders = async () => {
	try {
		await query(
			`CREATE TABLE orders (
        order_id VARCHAR(12) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        ist_id VARCHAR(10) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        nif VARCHAR(9),
        campus VARCHAR(50) NOT NULL,
        notes TEXT,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_responsible VARCHAR(100),
        payment_timestamp TIMESTAMP,
        paid BOOLEAN DEFAULT false,
        delivered BOOLEAN DEFAULT false,
        delivery_responsible VARCHAR(100),
        delivery_timestamp TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
		);

		await query(
			`CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(12) REFERENCES orders(order_id),
        product_id VARCHAR(50) NOT NULL,
        size VARCHAR(10) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
      )`,
		);

		await query("CREATE INDEX idx_order_items_order ON order_items(order_id)");
	} catch (err) {
		if (isDatabaseException(err) && err.code === PostgresError.DUPLICATE_TABLE)
			console.log("Debug: members already exists"); // table already exists
		else console.error(err);
	}
};

const generateOrderId = () => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let id = "";
	for (let i = 0; i < 12; i++) {
		id += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return id;
};

const checkOrderIdExists = async (client: PoolClient, orderId: string) => {
	const result = await client.query(
		"SELECT order_id FROM orders WHERE order_id = $1",
		[orderId],
	);
	return result.rows.length > 0;
};

const getUniqueOrderId = async (client: PoolClient) => {
	let orderId: string;
	let exists = false;
	let attempts = 0;
	const MAX_ATTEMPTS = 15;

	do {
		orderId = generateOrderId();
		exists = await checkOrderIdExists(client, orderId);
		attempts++;

		if (attempts >= MAX_ATTEMPTS) {
			throw new Error(
				"Não foi possível gerar um ID único após várias tentativas",
			);
		}
	} while (exists);

	return orderId;
};

const createOrder = async (orderData: OrderWithItems) => {
	const client = await getClient();
	try {
		await client.query("BEGIN");

		const orderId = await getUniqueOrderId(client);

		await client.query<{ order_id: string }>(
			`INSERT INTO orders(
          order_id,
          name, 
          ist_id,
          email, 
          phone,
          nif,
          campus, 
          notes,
          total_amount,
          paid,
          delivered
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING order_id`,
			[
				orderId,
				orderData.name,
				orderData.ist_id,
				orderData.email,
				orderData.phone,
				orderData.nif,
				orderData.campus,
				orderData.notes,
				orderData.total_amount,
				false,
				false,
			],
		);

		for (const item of orderData.items) {
			await client.query(
				`INSERT INTO order_items(
            order_id, 
            product_id, 
            size, 
            quantity, 
            unit_price
          ) VALUES($1, $2, $3, $4, $5)`,
				[orderId, item.product_id, item.size, item.quantity, item.unit_price],
			);
		}

		await client.query("COMMIT");
		return orderId;
	} catch (err) {
		await client.query("ROLLBACK");
		console.error(err);
		throw err;
	} finally {
		client.release();
	}
};

const deleteOrder = async (orderId: string) => {
	// TODO: check this
	const client = await getClient();
	try {
		await client.query("BEGIN");
		await client.query("DELETE FROM order_items WHERE order_id = $1", [
			orderId,
		]);
		await client.query("DELETE FROM orders WHERE order_id = $1", [orderId]);
		await client.query("COMMIT");
	} catch (err) {
		await client.query("ROLLBACK");
		if (
			isDatabaseException(err) &&
			err.code === PostgresError.FOREIGN_KEY_VIOLATION
		) {
			console.error("Erro ao deletar pedido:", err);
			throw new Error(
				"Não é possível deletar o pedido, pois ele está vinculado a outros registros.",
			);
		}

		console.error("Erro ao deletar pedido:", err);
		throw err;
	} finally {
		client.release();
	}
};

const getOrder = async (orderId: string) => {
	try {
		const orderResult = await query<Order>(
			"SELECT * FROM orders WHERE order_id = $1",
			orderId,
		);

		if (orderResult.rows.length === 0) {
			return null;
		}

		const order = orderResult.rows[0];

		const itemsResult = await query<OrderItem>(
			"SELECT * FROM order_items WHERE order_id = $1",
			orderId,
		);

		return {
			...order,
			items: itemsResult.rows,
		} as OrderWithItems;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const getAllOrders = async () => {
	try {
		const result = await query<Order>(
			"SELECT * FROM orders ORDER BY created_at DESC",
		);
		return result.rows;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const markOrderAsPaid = async (orderId: string, paymentResponsible: string) => {
	try {
		await query(
			`UPDATE orders 
         SET paid = true, 
             payment_responsible = $1,
             payment_timestamp = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $2`,
			paymentResponsible,
			orderId,
		);
		return true;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const markOrderAsNotPaid = async (orderId: string) => {
	try {
		await query(
			`UPDATE orders 
         SET paid = false, 
             payment_responsible = NULL,
             payment_timestamp = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $1`,
			orderId,
		);
		return true;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const markOrderAsDelivered = async (
	orderId: string,
	deliveryResponsible: string,
) => {
	try {
		await query(
			`UPDATE orders 
         SET delivered = true, 
             delivery_responsible = $1,
             delivery_timestamp = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $2`,
			deliveryResponsible,
			orderId,
		);
		return true;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const markOrderAsNotDelivered = async (orderId: string) => {
	try {
		await query(
			`UPDATE orders 
         SET delivered = false, 
             delivery_responsible = NULL,
             delivery_timestamp = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $1`,
			orderId,
		);
		return true;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const getOrdersByCustomerName = async (name: string) => {
	try {
		const result = await query<Order>(
			`SELECT * FROM orders 
         WHERE name ILIKE $1 
         ORDER BY created_at DESC`,
			`%${name}%`,
		);
		return result.rows;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const getOrdersByEmail = async (email: string) => {
	try {
		const result = await query<Order>(
			`SELECT * FROM orders 
         WHERE email ILIKE $1 
         ORDER BY created_at DESC`,
			`%${email}%`,
		);
		return result.rows;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const getOrdersByPhone = async (phone: string) => {
	try {
		const result = await query<Order>(
			`SELECT * FROM orders 
         WHERE phone LIKE $1 
         ORDER BY created_at DESC`,
			`%${phone}%`,
		);
		return result.rows;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const getOrdersByIstId = async (istId: string) => {
	try {
		const result = await query<Order>(
			`SELECT * FROM orders 
         WHERE ist_id ILIKE $1 
         ORDER BY created_at DESC`,
			`%${istId}%`,
		);
		return result.rows;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const getUnpaidOrders = async () => {
	try {
		const result = await query<Order>(
			`SELECT * FROM orders 
         WHERE paid = false 
         ORDER BY created_at DESC`,
		);
		return result.rows;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const getUndeliveredOrders = async () => {
	try {
		const result = await query<Order>(
			`SELECT * FROM orders 
         WHERE delivered = false 
         ORDER BY created_at DESC`,
		);
		return result.rows;
	} catch (err) {
		console.error(err);
		throw err;
	}
};

const getOrderItems = async (orderId: string) => {
	try {
		const result = await query<Order>(
			"SELECT * FROM order_items WHERE order_id = $1",
			orderId,
		);
		return result.rows;
	} catch (err) {
		console.error("Erro ao buscar itens do pedido:", err);
		throw err;
	}
};

export const ordersRepository = {
	deleteOrders,
	createOrders,
	createOrder,
	deleteOrder,
	getOrder,
	getAllOrders,
	markOrderAsPaid,
	markOrderAsNotPaid,
	markOrderAsDelivered,
	markOrderAsNotDelivered,
	getOrdersByCustomerName,
	getOrdersByEmail,
	getOrdersByPhone,
	getOrdersByIstId,
	getUnpaidOrders,
	getUndeliveredOrders,
	getOrderItems,
};
