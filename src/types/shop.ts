export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  images: string[];
  category?: string;
  size?: string;
  stock_type: "limited" | "on_demand";
  stock_quantity?: number;
  order_deadline?: string;
  estimated_delivery?: string;
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  variant_name: string;
  variant_value: string;
  images?: string[];
  price_modifier: number;
  stock_quantity?: number;
  size?: string;
  active: boolean;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  user_istid?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_nif?: string;
  campus?: string;
  items: OrderItem[];
  notes?: string;
  total_amount: number;
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  paid_at?: string;
  paid_by?: string;
  delivered_at?: string;
  delivered_by?: string;
  updated_at?: string;
  status: OrderStatus;
}

export interface OrderItem {
  product_id: number;
  product_name: string;
  variant_id?: number;
  variant_info?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export type OrderStatus = "pending" | "paid" | "preparing" | "ready" | "delivered" | "cancelled";

export function getTempProducts(): Product[] {
  return [
    {
      id: 1,
      name: "T-shirt NEIIST",
      description: "Camisola oficial do núcleo.",
      price: 12,
      images: ["/products/green-0.png", "/products/green-1.png"],
      category: "Vestuário",
      stock_type: "limited",
      stock_quantity: 50,
      order_deadline: "2025-09-01",
      estimated_delivery: "2025-09-15",
      variants: [
        {
          id: 1,
          variant_name: "Tamanho",
          variant_value: "M",
          images: ["/products/green-1.png"],
          price_modifier: 0,
          stock_quantity: 20,
          size: "M",
          active: true,
        },
        {
          id: 2,
          variant_name: "Tamanho",
          variant_value: "L",
          images: ["/products/green-2.png"],
          price_modifier: 0,
          stock_quantity: 30,
          size: "L",
          active: true,
        },
      ],
    },
    {
      id: 2,
      name: "Sticker NEIIST",
      description: "Autocolante para portátil.",
      price: 2,
      images: ["/products/green-4.png"],
      category: "Merch",
      stock_type: "on_demand",
      order_deadline: "2025-09-10",
      estimated_delivery: "2025-09-25",
      variants: [],
    },
    {
      id: 3,
      name: "Sweat NEIIST",
      description: "Sweat confortável para os dias frios.",
      price: 25,
      images: ["/products/green-0.png", "/products/green-3.png"],
      category: "Vestuário",
      stock_type: "limited",
      stock_quantity: 15,
      order_deadline: "2025-09-01",
      estimated_delivery: "2025-09-20",
      variants: [
        {
          id: 3,
          variant_name: "Tamanho",
          variant_value: "M",
          images: ["/products/green-3.png"],
          price_modifier: 0,
          stock_quantity: 7,
          size: "M",
          active: true,
        },
        {
          id: 4,
          variant_name: "Tamanho",
          variant_value: "L",
          images: ["/products/green-3.png"],
          price_modifier: 0,
          stock_quantity: 8,
          size: "L",
          active: true,
        },
      ],
    },
  ];
}

export function getTempOrders(): Order[] {
  return [
    {
      id: 1,
      order_number: "ORD-2025001",
      customer_name: "Miguel Póvoa Raposo",
      user_istid: "ist1109686",
      customer_email: "miguel.p.raposo@tecnico.ulisboa.pt",
      customer_phone: "912345678",
      customer_nif: "123456789",
      campus: "TagusPark",
      items: [
        {
          product_id: 1,
          product_name: "T-shirt NEIIST",
          variant_id: 1,
          variant_info: "Tamanho: M",
          quantity: 2,
          unit_price: 12,
          total_price: 24,
        },
        {
          product_id: 2,
          product_name: "Sticker NEIIST",
          quantity: 5,
          unit_price: 2,
          total_price: 10,
        },
      ],
      notes: "Entregar na sala do núcleo.",
      total_amount: 34,
      payment_method: "MBWay",
      payment_reference: "MBW123456",
      created_at: "2025-08-01T10:00:00Z",
      paid_at: "2025-08-01T12:00:00Z",
      paid_by: "Miguel Póvoa Raposo",
      delivered_at: "2025-08-05T15:00:00Z",
      delivered_by: "Francisca Almeida",
      updated_at: "2025-08-05T15:00:00Z",
      status: "delivered",
    },
    {
      id: 2,
      order_number: "ORD-2025002",
      customer_name: "Inês Costa",
      user_istid: "ist1110632",
      customer_email: "inesiscosta@tecnico.ulisboa.pt",
      customer_phone: "934567890",
      items: [
        {
          product_id: 3,
          product_name: "Sweat NEIIST",
          variant_id: 4,
          variant_info: "Tamanho: L",
          quantity: 1,
          unit_price: 25,
          total_price: 25,
        },
      ],
      total_amount: 25,
      payment_method: "Dinheiro",
      created_at: "2025-08-02T11:30:00Z",
      status: "pending",
    },
  ];
}
