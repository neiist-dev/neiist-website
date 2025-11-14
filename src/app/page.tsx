import Hero from "@/components/homepage/Hero";
import Activities from "@/components/homepage/Activities";
import Partnerships from "@/components/homepage/Partnerships";
import SweatsContest from "@/components/homepage/SweatsContest";
import { Event } from "@/types/events";

const HomePage = async () => {
  return (
    <>
      <Hero />
      <SweatsContest />
      <Activities />
      <Partnerships />
    </>
  );
};

export default HomePage;
