import React, { useState, useEffect } from "react";
import { Badge, Tooltip, Button, Group } from "@mantine/core";
import { MdDownload, MdEmail } from "react-icons/md";
import { OrdersTable } from "./OrdersTable.jsx";
import LoadSpinner from "../../hooks/loadSpinner.jsx";
import { fetchAllOrdersDetails, generateExcel } from "../../Api.service.js";

export const AllOrdersPage = ({ keySelected, loggedInUser }) => {
  const [allOrders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [bcc, setBcc] = useState("");

  useEffect(() => {
    if (keySelected === "active") {
      fetchAllOrdersDetails()
        .then((ordersRes) => {
          setOrders(ordersRes);
        })
        .catch((err) => {
          setError(err);
        });
    }

    if (keySelected === "pending") {
      fetchAllOrdersDetails()
        .then((ordersRes) => {
          setOrders(
            ordersRes.filter((order) => !order.delivered && !order.paid)
          );
        })
        .catch((err) => {
          setError(err);
        });
    }

    if (keySelected === "paid") {
      fetchAllOrdersDetails()
        .then((ordersRes) => {
          setOrders(
            ordersRes.filter((order) => !order.delivered && order.paid)
          );
        })
        .catch((err) => {
          setError(err);
        });
    }

    if (keySelected === "delivered") {
      fetchAllOrdersDetails()
        .then((ordersRes) => {
          setOrders(ordersRes.filter((order) => order.delivered));
        })
        .catch((err) => {
          setError(err);
        });
    }
  }, [keySelected]);

  useEffect(() => {
    if (allOrders) {
      setBcc(allOrders.map((order) => order.email).join(","));
    }
  }, [allOrders]);

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

  const downloadExcel = async (orders) => {
    try {
      const blob = await generateExcel(orders);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "entrega-merch-neiist.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading excel:", error);
    }
  };

  if (error) {
    return <div className="error-container">Error: {error.message}</div>;
  }

  return (
    <div className="page-container">
      <div className="header-section">
        <h1>
          {/* <b>All Orders</b>{" "} */}
          <b>
            {keySelected.charAt(0).toUpperCase() +
              keySelected.slice(1).toLowerCase()}{" "}
            Orders
          </b>
          <span className="count">({allOrders?.length ?? 0})</span>
        </h1>

        <div className="status-buttons">
          {keySelected === "active" && (
            <div className="badge-container">
              <Badge variant="filled" size="xl" color="yellow">
                {allOrders?.filter((order) => !order.delivered && !order.paid)
                  .length ?? 0}{" "}
                Pending
              </Badge>
              <Badge variant="filled" size="xl" color="blue">
                {allOrders?.filter((order) => !order.delivered && order.paid)
                  .length ?? 0}{" "}
                Paid
              </Badge>
              <Badge variant="filled" size="xl" color="green">
                {allOrders?.filter((order) => order.delivered).length ?? 0}{" "}
                Delivered
              </Badge>
            </div>
          )}

          <div className="action-buttons">
            <Tooltip label="Send Email to Customer">
              <Button
                leftSection={<MdEmail size="1.2rem" />}
                component="a"
                href={`mailto:neiist@tecnico.ulisboa.pt?subject=[NEIIST]${
                  keySelected == "paid"
                    ? "Entrega das Sweats e dos Casacos de EIC"
                    : ""
                }
                  &bcc=${bcc}
                  `}
              >
                Contact All Customers
              </Button>
            </Tooltip>
            <Tooltip
              position="top"
              withArrow
              transitionProps={{ duration: 500 }}
              label="Export Active Orders"
            >
              <Button
                color="orange"
                onClick={() => {
                  downloadExcel(allOrders);
                }}
              >
                <MdDownload size="1.25em" />
              </Button>
            </Tooltip>
          </div>
        </div>

        <hr />
      </div>

      {allOrders ? (
        <OrdersTable
          orders={allOrders}
          onUpdateStatus={handleUpdateStatus}
          loggedInUser={loggedInUser}
        />
      ) : (
        <LoadSpinner />
      )}
    </div>
  );
};
