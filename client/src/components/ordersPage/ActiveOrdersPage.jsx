import React, { useState, useEffect } from "react";
import { Badge, Tooltip, Button, Group } from "@mantine/core";
import { MdDownload, MdEmail } from "react-icons/md";
import { OrdersTable } from "./OrdersTable";
import LoadSpinner from "../../hooks/loadSpinner.jsx";
import { fetchAllOrdersDetails } from "../../Api.service.js";

export const ActiveOrdersPage = ({ keySelected, loggedInUser }) => {
  const [activeOrders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keySelected === "active" && activeOrders === null) {
      fetchAllOrdersDetails()
        .then((ordersRes) => {
          setOrders(ordersRes);
        })
        .catch((err) => {
          setError(err);
        });
    }
  }, [keySelected]);

  const handleUpdateStatus = async (updatedOrder) => {
    try {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id === updatedOrder.order_id ? updatedOrder : order
        )
      );
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  if (error) {
    return <div className="error-container">Error: {error.message}</div>;
  }

  return (
    <div className="page-container">
      <div className="header-section">
        <h1>
          <b>Active Orders</b>{" "}
          <span className="count">({activeOrders?.length ?? 0})</span>
        </h1>

        <div className="status-buttons">
          <div className="badge-container">
            <Badge variant="filled" size="xl" color="yellow">
              {activeOrders?.filter((order) => !order.delivered && !order.paid)
                .length ?? 0}{" "}
              Pending
            </Badge>
            <Badge variant="filled" size="xl" color="blue">
              {activeOrders?.filter((order) => !order.delivered && order.paid)
                .length ?? 0}{" "}
              Paid
            </Badge>
            <Badge variant="filled" size="xl" color="green">
              {activeOrders?.filter((order) => order.delivered).length ?? 0}{" "}
              Delivered
            </Badge>
          </div>

          <div className="action-buttons">
            <Tooltip
              position="top"
              withArrow
              transitionProps={{ duration: 500 }}
              label="Export Active Orders"
            >
              <Button
                color="orange"
                onClick={() => {
                  /* Export Function */
                }}
              >
                <MdDownload size="1.25em" />
              </Button>
            </Tooltip>
          </div>
        </div>
        <hr />
      </div>

      {activeOrders ? (
        <OrdersTable
          orders={activeOrders}
          onUpdateStatus={handleUpdateStatus}
          loggedInUser={loggedInUser}
        />
      ) : (
        <LoadSpinner />
      )}
    </div>
  );
};
