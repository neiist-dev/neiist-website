import React from "react";
// import SINFO from "@/components/homepage/Sinfo";
import Partnerships from "@/components/homepage/Partnerships";
import style from "@/styles/pages/HomePage.module.css";
import Hero from "@/components/homepage/Hero";
import Activities from "@/components/homepage/Activities";
import { getAllEvents } from "@/utils/dbUtils";
import { Event } from "@/types/events";

const HomePage = async () => {
  const events: Event[] = await getAllEvents();
  return (
    <div className={style.homepage}>
      <Hero />
      <Activities events={events} />
      {/*
      <SINFO />
      */}
      <Partnerships />
    </div>
  );
};

export default HomePage;
