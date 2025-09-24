import { useState, useContext, useEffect } from "react";
import { Tabs } from "@mantine/core";
import { BiSearch } from "react-icons/bi";
import { AllOrdersPage } from "../components/ordersPage/AllOrdersPage";
import { SearchOrders } from "../components/ordersPage/SearchOrders";
import { fetchOrdersWithDetails } from "../Api.service.js";
import UserDataContext from "../UserDataContext";
import LoadSpinner from "../hooks/loadSpinner.jsx";
import "../components/css/Orders.module.css";

export const OrdersPage = () => {
  const { userData } = useContext(UserDataContext);
  const [activeTab, setActiveTab] = useState("active");
  const [ordersFilters, setOrdersFilters] = useState({
    active: [],
    pending: [],
    paid: [],
    delivered: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loggedInUser = userData?.username;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const fetchedOrders = await fetchOrdersWithDetails();

        setOrdersFilters({
          active: fetchedOrders,
          pending: fetchedOrders.filter(
            (order) => !order.delivered && !order.paid
          ),
          paid: fetchedOrders.filter((order) => !order.delivered && order.paid),
          delivered: fetchedOrders.filter((order) => order.delivered),
        });
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to fetch orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return <LoadSpinner/>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="orders-page" style={{ paddingRight: "8%", paddingLeft: "8%" }}>
      <br />
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="pills"
        color="blue"
        defaultValue="active"
      >
        <Tabs.List>
          <Tabs.Tab value="active" style={{ fontWeight: "bold" }}>
            All Orders
          </Tabs.Tab>
          <Tabs.Tab value="pending" style={{ fontWeight: "bold" }}>
            Pending Orders
          </Tabs.Tab>
          <Tabs.Tab value="paid" style={{ fontWeight: "bold" }}>
            Paid Orders
          </Tabs.Tab>
          <Tabs.Tab value="delivered" style={{ fontWeight: "bold" }}>
            Delivered Orders
          </Tabs.Tab>
          <Tabs.Tab value="search" style={{ fontWeight: "bold" }}>
            Search <BiSearch size="1.25em" />
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="active" pt="xs">
          <AllOrdersPage
            keySelected={activeTab}
            loggedInUser={loggedInUser}
            orders={ordersFilters.active}
          />
        </Tabs.Panel>
        <Tabs.Panel value="pending" pt="xs">
          <AllOrdersPage
            keySelected={activeTab}
            loggedInUser={loggedInUser}
            orders={ordersFilters.pending}
          />
        </Tabs.Panel>
        <Tabs.Panel value="paid" pt="xs">
          <AllOrdersPage
            keySelected={activeTab}
            loggedInUser={loggedInUser}
            orders={ordersFilters.paid}
          />
        </Tabs.Panel>
        <Tabs.Panel value="delivered" pt="xs">
          <AllOrdersPage
            keySelected={activeTab}
            loggedInUser={loggedInUser}
            orders={ordersFilters.delivered}
          />
        </Tabs.Panel>
        <Tabs.Panel value="search" pt="xs">
          <SearchOrders keySelected={activeTab} loggedInUser={loggedInUser} orders={ordersFilters.active} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default OrdersPage;