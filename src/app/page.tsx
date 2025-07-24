import React from "react";
import SINFO from "@/components/homepage/Sinfo";
import Partnerships from "@/components/homepage/Partnerships";
import style from "@/styles/pages/HomePage.module.css";

const HomePage = () => {
  return (
    <div className={style.homepage}>
      <SINFO />
      <Partnerships />
    </div>
  );
};

export default HomePage;
