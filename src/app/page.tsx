import React from "react";
import SINFO from "@/components/homepage/Sinfo";
import Partnerships from "@/components/homepage/Partnerships";
import style from "@/styles/pages/HomePage.module.css";
import Hero from "@/components/homepage/Hero";
import Activities from "@/components/homepage/Activities";

const HomePage = () => {
  return (
    <div className={style.homepage}>
      <Hero />
      <Activities />
      <SINFO />
      <Partnerships />
    </div>
  );
};

export default HomePage;
