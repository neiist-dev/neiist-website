import React, { useState, useEffect } from "react";
import {
  Table,
  Group,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  ScrollArea,
} from "@mantine/core";
import { AiOutlineEye } from "react-icons/ai";
import { MdContentCopy } from "react-icons/md";
import { OrderDetailsModal } from "./OrderDetailsModal";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
};

const getOrderStatus = (order) => {
  if (order.delivered) return "delivered";
  if (order.paid) return "paid";
  return "pending";
};

const statusColors = {
  pending: "yellow",
  paid: "blue",
  delivered: "green",
};

export const OrdersTable = ({ orders, onUpdateStatus, loggedInUser }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [localOrders, setLocalOrders] = useState(orders);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const handleShowDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCloseDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleOrderUpdate = async (updatedOrder) => {
    try {
      setSelectedOrder(updatedOrder);
      setLocalOrders((prev) =>
        prev.map((order) =>
          order.order_id === updatedOrder.order_id ? updatedOrder : order
        )
      );
      if (onUpdateStatus) {
        await onUpdateStatus(updatedOrder);
      }
    } catch (error) {
      console.error(error);
    }
    // setLocalOrders((prev) =>
    //   prev.map((order) =>
    //     order.order_id === updatedOrder.order_id ? updatedOrder : order
    //   )
    // );
    // setSelectedOrder(updatedOrder);
    // onUpdateStatus?.(updatedOrder);
  };

  const rows = localOrders?.map((order, index) => {
    const status = getOrderStatus(order);

    return (
      <Table.Tr
        key={order.order_id}
        style={
          index % 2 === 1 ? { backgroundColor: "rgba(0, 0, 0, 0.08)" } : {}
        }
      >
        <Table.Td>
          <Group>
            <div>
              <Text fw={500}>#{order.order_id}</Text>
              <Text size="sm" c="dimmed">
                {new Date(order.created_at).toLocaleDateString()}
              </Text>
            </div>
          </Group>
        </Table.Td>
        <Table.Td>
          <Text fw={500}>{order.name}</Text>
          <Text size="sm" c="dimmed">
            {order.email}
          </Text>
          <Text size="xs" c="dimmed">
            {order.ist_id}
          </Text>
        </Table.Td>
        <Table.Td>
          <Badge
            color={statusColors[status]}
            variant="filled"
            size="lg"
            radius="sm"
            style={{ textTransform: "capitalize" }}
          >
            {status}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Text fw={500}>{formatCurrency(order.total_amount)}</Text>
          <Text size="xs" c="dimmed">
            Campus: {order.campus}
          </Text>
        </Table.Td>
        <Table.Td>
          <Group gap={0} justify="flex-end">
            <Tooltip label="View Details">
              <ActionIcon onClick={() => handleShowDetails(order)}>
                <AiOutlineEye size="1.25rem" />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Copy Order ID" style={{ paddingRight: "1rem" }}>
              <ActionIcon
                onClick={() => navigator.clipboard.writeText(order.order_id)}
              >
                <MdContentCopy size="1.25rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <>
      <OrderDetailsModal
        show={showOrderDetails}
        order={selectedOrder}
        onClose={handleCloseDetails}
        loggedInUser={loggedInUser}
        onUpdateOrder={handleOrderUpdate}
      />
      <ScrollArea>
        <Table verticalSpacing="sm" style={{ backgroundColor: "white" }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Order ID</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
};
