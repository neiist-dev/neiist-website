import React, { Suspense, lazy, useState } from 'react';
import { GradientSegmentedControl } from '../components/mantine/GradientSegmentedControl';
import LoadSpinner from '../hooks/loadSpinner';

const AdminAreasPage = lazy(() => import("./AdminAreasPage"));
const AdminThesesPage = lazy(() => import("./AdminThesesPage"));
const AdminElectionsPage = lazy(() => import("./AdminElectionsPage"));
const AdminNewSocialOrgans = lazy(() => import("./AdminNewSocialOrgans"));

const AdminMenuPage = () => {
  const sections = ["Áreas", "Teses", "Eleições", "Novos Orgãos"]
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
      <Suspense fallback={<LoadSpinner />}>
        {value === "Áreas" && <AdminAreasPage />}
        {value === "Teses" && <AdminThesesPage />}
        {value === "Eleições" && <AdminElectionsPage />}
        {value === "Novos Orgãos" && <AdminNewSocialOrgans />}
      </Suspense>
    </div>
  );
};

export default AdminMenuPage;
