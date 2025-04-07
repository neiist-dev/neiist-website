export interface Product {
    id: string;
    type: string;
    subtype: string;
    name: string;
    displayName: {
        text: string;
        html: string;
        components: {
            text: string;
            style: string;
        }[];
    }
    price: number;
    stockType: string;
    orderInfo: {
        estimatedDelivery: string;
        minOrderQuantity: number;
        orderDeadline: string;
    };
    visible: boolean;
    featured: boolean;
    color: {
        name: string;
        hex: string;
    };
    variants: {
        size: string;
        available: boolean;
        stockQuantity: number | null;
    }[];
    images: {
        url: string;
        alt: string;
        isPrimary: boolean;
    }[];
    
}

export interface Order {
    order_id: string;
    name: string;
    ist_id: string;
    email: string;
    phone?: string;
    nif?: string;
    campus: string;
    notes?: string;
    total_amount: number;
    payment_responsible?: string;
    payment_timestamp?: Date;
    paid: boolean;
    delivered: boolean;
    delivery_responsible?: string;
    delivery_timestamp?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface OrderWithItems extends Order {
    items: OrderItem[];
}

export interface OrderItem {
    id: number;
    order_id: string;
    product_id: string;
    size: string;
    quantity: number;
    unit_price: number;
}