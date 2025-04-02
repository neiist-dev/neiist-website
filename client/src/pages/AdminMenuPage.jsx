import React, { lazy, useState } from "react";
import { GradientSegmentedControl } from "../components/mantine/GradientSegmentedControl.jsx";

const AdminAreasPage = lazy(() => import("./AdminAreasPage.jsx"));
const AdminThesesPage = lazy(() => import("./AdminThesesPage.jsx"));
const AdminOrdersPage = lazy(() => import("./AdminOrdersPage.jsx"));
const AdminElectionsPage = lazy(() => import("./AdminElectionsPage.jsx"));

const SECTIONS = ["Áreas", "Teses", "Eleições", "Encomendas"];

const PAGES = {
  Áreas: AdminAreasPage,
  Teses: AdminThesesPage,
  Eleições: AdminElectionsPage,
  Encomendas: AdminOrdersPage,
};

const AdminMenuPage = () => {
  const [value, setValue] = useState(SECTIONS[0]);

  const SelectedComponent = PAGES[value];

  return (
    <div>
      <div
        style={{
          alignItems: "center",
          margin: "2rem 6em",
          display: "flex",
          justifyContent: "center",
          alignContent: "space-around",
          flexWrap: "wrap",
        }}
      >
        <GradientSegmentedControl data={SECTIONS} setValue={setValue} />
      </div>
      <SelectedComponent />
    </div>
  );
};

export default AdminMenuPage;
