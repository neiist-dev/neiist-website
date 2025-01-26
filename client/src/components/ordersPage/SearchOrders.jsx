import React, { useState, useEffect } from "react";
import { TextInput, Button, Group, Text } from "@mantine/core";
import { OrdersTable } from "./OrdersTable";
import LoadSpinner from "../../hooks/loadSpinner.jsx";
import { fetchOrders } from "../../Api.service.js";
import { BiSearch } from "react-icons/bi";

export const SearchOrders = ({ keySelected, loggedInUser }) => {
  const [allOrders, setOrders] = useState(null);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (keySelected === "search" && allOrders === null) {
      fetchOrders()
        .then((ordersRes) => {
          setOrders(ordersRes);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err);
          setIsLoading(false);
        });
    }
  }, [keySelected]);

  const handleSearch = (value) => {
    setSearchInput(value);

    if (!value.trim()) {
      setFilteredOrders([]);
      return;
    }

    const searchTerm = value.toLowerCase();
    const filtered =
      allOrders?.filter(
        (order) =>
          order.order_id.toLowerCase().includes(searchTerm) ||
          order.name.toLowerCase().includes(searchTerm) ||
          order.ist_id.toLowerCase().includes(searchTerm) ||
          order.email.toLowerCase().includes(searchTerm) ||
          (order.notes && order.notes.toLowerCase().includes(searchTerm)) ||
          order.campus.toLowerCase().includes(searchTerm) ||
          (order.nif && order.nif.toLowerCase().includes(searchTerm))
      ) ?? [];

    setFilteredOrders(filtered);
  };

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
          <b>Search Orders</b>
        </h1>

        <div className="search-container">
          <TextInput
            icon={<BiSearch />}
            value={searchInput}
            onChange={(event) => handleSearch(event.currentTarget.value)}
            placeholder="Search by ID, name, IST ID, email, campus or notes..."
            style={{ maxWidth: "600px" }}
          />

          {filteredOrders.length > 0 && (
            <Text size="sm" color="dimmed" mt="xs">
              Found {filteredOrders.length} matching orders
            </Text>
          )}
        </div>
        <hr />
      </div>

      {isLoading ? (
        <LoadSpinner />
      ) : (
        <>
          {searchInput && filteredOrders.length === 0 ? (
            <div className="no-results">
              <Text align="center" color="dimmed">
                No orders found matching your search
              </Text>
            </div>
          ) : (
            filteredOrders.length > 0 && (
              <OrdersTable
                orders={filteredOrders}
                onUpdateStatus={handleUpdateStatus}
                loggedInUser={loggedInUser}
              />
            )
          )}
        </>
      )}
    </div>
  );
};
