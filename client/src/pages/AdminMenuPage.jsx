import React from 'react';
import Button from 'react-bootstrap/Button';
import { Link } from 'react-router-dom';

const AdminMenuPage = () => (
  <div style={{
    alignItems: 'center',
    margin: '2rem 6em',
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'space-around',
    flexWrap: 'wrap',
    gap: '20px',
  }}
  >
    <Button as={Link} to="/admin/areas">
      Áreas
    </Button>
    <Button as={Link} to="/admin/theses">
      Teses
    </Button>
    <Button as={Link} to="/admin/elections">
      Eleições
    </Button>
    <Button as={Link} to="/admin/new_organs">
      New Organs
    </Button>
  </div>
);

export default AdminMenuPage;
