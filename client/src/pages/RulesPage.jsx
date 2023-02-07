import React from 'react';

const RulesPage = () => (
  <>
    <div style={{ margin: '2rem 6em 1rem 6em' }}>
      <h2 style={{ textAlign: 'center' }}>ESTATUTOS</h2>
    </div>

    <div style={{ margin: '1rem 6em 2rem 6em' }}>
      <iframe
        title="Estatutos do NEIIST"
        src={`${process.env.PUBLIC_URL}/estatutos.pdf`}
        width="100%"
        height="1200px"
      />
    </div>
  </>
);

export default RulesPage;
