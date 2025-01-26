import React, { useContext, useEffect, useState } from "react";
import {
  Modal,
  Text,
  Card,
  Group,
  Badge,
  Divider,
  Select,
  Button,
  Stack,
  Grid,
  ActionIcon,
  Switch,
  Tooltip,
  Table,
} from "@mantine/core";
import { MdEmail, MdPhone, MdLocationOn, MdReceipt } from "react-icons/md";
import {
  markOrderAsPaid,
  markOrderAsNotPaid,
  markOrderAsDelivered,
  markOrderAsNotDelivered,
} from "../../Api.service";

const statusColors = {
  pending: "yellow",
  paid: "blue",
  delivered: "green",
};

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

export const OrderDetailsModal = ({
  show,
  order,
  onClose,
  loggedInUser,
  onUpdateOrder,
}) => {
  const [localOrder, setLocalOrder] = useState(order);

  useEffect(() => {
    setLocalOrder(order);
  }, [order]);

  if (!localOrder || !order) return null;

  const status = getOrderStatus(localOrder);

  const handlePaymentToggle = async (checked) => {
    try {
      if (checked) {
        await markOrderAsPaid(localOrder.order_id, loggedInUser);
      } else {
        await markOrderAsNotPaid(localOrder.order_id, loggedInUser);
      }
      const updatedOrder = { ...localOrder, paid: checked };
      onUpdateOrder(updatedOrder);

      setLocalOrder((prev) => ({ ...prev, paid: checked }));
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const handleDeliveryToggle = async (checked) => {
    try {
      if (checked) {
        await markOrderAsDelivered(localOrder.order_id, loggedInUser);
      } else {
        await markOrderAsNotDelivered(localOrder.order_id, loggedInUser);
      }
      const updatedOrder = { ...localOrder, delivered: checked };
      onUpdateOrder(updatedOrder);

      setLocalOrder((prev) => ({ ...prev, delivered: checked }));
    } catch (error) {
      console.error("Error updating delivery status:", error);
    }
  };

  return (
    <Modal
      opened={show}
      onClose={onClose}
      title={
        <Group position="apart" style={{ width: "100%" }}>
          <Text fw={700} size="xl">
            Order #{localOrder.order_id}
          </Text>
          <Badge
            color={statusColors[status]}
            variant="filled"
            size="lg"
            style={{ textTransform: "capitalize" }}
          >
            {status}
          </Badge>
          <hr></hr>
        </Group>
      }
      size="xl"
      styles={{
        root: {
          zIndex: 1,
        },
        header: {
          paddingTop: "8%",
        },
      }}
    >
      <Stack spacing="md">
        {/* Customer Information */}
        <Card withBorder>
          <Text fw={700} mb="md" size="lg">
            Customer Information
          </Text>
          <Grid>
            <Grid.Col span={6}>
              <Stack spacing="xs">
                <Text fw={500}>{localOrder.name}</Text>
                <Text size="sm">IST ID: {localOrder.ist_id}</Text>
                <Group spacing="xs">
                  <MdEmail size="1.2rem" />
                  <Text size="sm">{localOrder.email}</Text>
                </Group>
                <Group spacing="xs">
                  <MdPhone size="1.2rem" />
                  <Text size="sm">{localOrder.phone}</Text>
                </Group>
                {localOrder.nif && (
                  <Group spacing="xs">
                    <MdReceipt size="1.2rem" />
                    <Text size="sm">NIF: {localOrder.nif}</Text>
                  </Group>
                )}
              </Stack>
            </Grid.Col>
            <Grid.Col span={6}>
              <Stack spacing="xs">
                <Group spacing="xs">
                  <MdLocationOn size="1.2rem" />
                  <Text fw={500}>Campus</Text>
                </Group>
                <Text size="sm" style={{ textTransform: "capitalize" }}>
                  {localOrder.campus}
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Card>

        <Card withBorder>
          <Text fw={700} mb="md" size="lg">
            Order Items
          </Text>
          <Table>
            <thead>
              <tr>
                <th>Product ID</th>
                <th>Size</th>
                <th style={{ textAlign: "center" }}>Quantity</th>
                <th style={{ textAlign: "right" }}>Unit Price</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {localOrder.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_id}</td>
                  <td>{item.size}</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatCurrency(item.unit_price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* Order Details */}
        <Card withBorder>
          <Text fw={700} mb="md" size="lg">
            Order Details
          </Text>
          <Stack spacing="md">
            <Group position="apart">
              <Text fw={500}>Total Amount</Text>
              <Text fw={700} size="lg">
                {formatCurrency(localOrder.total_amount)}
              </Text>
            </Group>

            {localOrder.notes && (
              <>
                <Divider />
                <div>
                  <Text fw={500} mb="xs">
                    Notes
                  </Text>
                  <Text size="sm">{localOrder.notes}</Text>
                </div>
              </>
            )}
          </Stack>
        </Card>

        {/* Order Status */}
        <Card withBorder>
          <Text fw={700} mb="md" size="lg">
            Order Status
          </Text>
          <Stack spacing="md">
            <Group position="apart">
              <Text>Payment Status</Text>
              <Switch
                checked={localOrder.paid}
                onChange={(event) =>
                  handlePaymentToggle(event.currentTarget.checked)
                }
                label={localOrder.paid ? "Paid" : "Pending"}
              />
            </Group>
            {localOrder.paid && localOrder.payment_responsible && (
              <Text size="sm" c="dimmed">
                Paid checked by {localOrder.payment_responsible} at{" "}
                {new Date(localOrder.payment_timestamp).toLocaleString()}
              </Text>
            )}

            <Divider />

            <Group position="apart">
              <Text>Delivery Status</Text>
              <Switch
                checked={localOrder.delivered}
                onChange={(event) =>
                  handleDeliveryToggle(event.currentTarget.checked)
                }
                label={localOrder.delivered ? "Delivered" : "Pending"}
                disabled={!localOrder.paid}
              />
            </Group>
            {localOrder.delivered && localOrder.delivery_responsible && (
              <Text size="sm" c="dimmed">
                Delivered by {localOrder.delivery_responsible} at{" "}
                {new Date(localOrder.delivery_timestamp).toLocaleString()}
              </Text>
            )}
          </Stack>
        </Card>

        {/* Timestamps */}
        <Card withBorder>
          <Text fw={700} mb="md" size="lg">
            Order Timeline
          </Text>
          <Stack spacing="xs">
            <Group position="apart">
              <Text size="sm">Created</Text>
              <Text size="sm" c="dimmed">
                {new Date(localOrder.created_at).toLocaleString()}
              </Text>
            </Group>
            <Group position="apart">
              <Text size="sm">Last Updated</Text>
              <Text size="sm" c="dimmed">
                {new Date(localOrder.updated_at).toLocaleString()}
              </Text>
            </Group>
          </Stack>
        </Card>

        {/* Action Buttons */}
        <Group position="right">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Close
          </Button>
          <Tooltip label="Send Email to Customer">
            <Button
              leftSection={<MdEmail size="1.2rem" />}
              component="a"
              href={`mailto:${localOrder.email}`}
            >
              Contact Customer
            </Button>
          </Tooltip>
        </Group>
      </Stack>
    </Modal>
  );
};
