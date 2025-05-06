import React from 'react';
import Hero from '@/components/homepage/Hero';
import Objectives from '@/components/homepage/Objectives';
/*import Activities from '@/components/homepage/Activities'; */
import SINFO from '@/components/homepage/Sinfo';
import Partnerships from '@/components/homepage/Partnerships';
import Mission from '@/components/homepage/Mission';
import style from '@/styles/pages/HomePage.module.css';

const HomePage = () => {
  return (
    <div className={style.homepage}>
      <Hero/>
      <div className={style.columnLayout}>
        <Mission/>
        <Objectives/>
      </div>
      <SINFO/>
      <Partnerships/>
    </div>
  );
};

export default HomePage;
