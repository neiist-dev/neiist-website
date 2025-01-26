import React, { useState, useContext } from "react";
import { Tabs } from "@mantine/core";
import { BiSearch } from "react-icons/bi";
import { AllOrdersPage } from "../components/ordersPage/AllOrdersPage";
import { SearchOrders } from "../components/ordersPage/SearchOrders";

import UserDataContext from "../UserDataContext";

import "../components/css/Orders.module.css";

export const OrdersPage = () => {
  const { userData } = useContext(UserDataContext);
  const [activeTab, setActiveTab] = useState("active");

  const loggedInUser = userData?.username;

  return (
    <div
      className="orders-page"
      style={{ paddingRight: "8%", paddingLeft: "8%" }}
    >
      <br></br>
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
          <AllOrdersPage keySelected={activeTab} loggedInUser={loggedInUser} />
        </Tabs.Panel>

        <Tabs.Panel value="pending" pt="xs">
          <AllOrdersPage keySelected={activeTab} loggedInUser={loggedInUser} />
        </Tabs.Panel>

        <Tabs.Panel value="paid" pt="xs">
          <AllOrdersPage keySelected={activeTab} loggedInUser={loggedInUser} />
        </Tabs.Panel>

        <Tabs.Panel value="delivered" pt="xs">
          <AllOrdersPage keySelected={activeTab} loggedInUser={loggedInUser} />
        </Tabs.Panel>

        <Tabs.Panel value="search" pt="xs">
          <SearchOrders keySelected={activeTab} loggedInUser={loggedInUser} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default OrdersPage;
