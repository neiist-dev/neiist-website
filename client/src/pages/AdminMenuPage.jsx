import React, { lazy, useState } from 'react';
import { GradientSegmentedControl } from '../components/mantine/GradientSegmentedControl';

const AdminAreasPage = lazy(() => import("./AdminAreasPage"));
const AdminThesesPage = lazy(() => import("./AdminThesesPage"));
const AdminElectionsPage = lazy(() => import("./AdminElectionsPage"));

const AdminMenuPage = () => {
  const sections = ["Áreas", "Teses", "Eleições"]
  const [value, setValue] = useState(sections[0])

  return (
    <div>
      <div style={{
        alignItems: 'center',
        margin: '2rem 6em',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'space-around',
        flexWrap: 'wrap',
      }}
      >
        <GradientSegmentedControl data={sections} setValue={setValue}/>
      </div>
      {value === "Áreas" && <AdminAreasPage />}
      {value === "Teses" && <AdminThesesPage />}
      {value === "Eleições" && <AdminElectionsPage />}
    </div>
  );
};

export default AdminMenuPage;
