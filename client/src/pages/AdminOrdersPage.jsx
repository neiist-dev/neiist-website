import React, { useState, useContext } from "react";
import { Tabs } from "@mantine/core";
import { BiSearch } from "react-icons/bi";
import { ActiveOrdersPage } from "../components/ordersPage/ActiveOrdersPage";
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
            Active Orders
          </Tabs.Tab>
          <Tabs.Tab value="search" style={{ fontWeight: "bold" }}>
            Search <BiSearch size="1.25em" />
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="active" pt="xs">
          <ActiveOrdersPage
            keySelected={activeTab}
            loggedInUser={loggedInUser}
          />
        </Tabs.Panel>

        <Tabs.Panel value="search" pt="xs">
          <SearchOrders keySelected={activeTab} loggedInUser={loggedInUser} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default OrdersPage;
