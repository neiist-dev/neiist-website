import Hero from "@/components/homepage/Hero";
import Activities from "@/components/homepage/Activities";
import Partnerships from "@/components/homepage/Partnerships";
import SweatsContest from "@/components/homepage/SweatsContest";
import { Event } from "@/types/events";
import { getAllEvents } from "@/utils/dbUtils";

const HomePage = async () => {
  const events: Event[] = await getAllEvents();
  return (
    <>
      <Hero />
      <SweatsContest />
      <Activities events={events} />
      <Partnerships />
    </>
  );
};

export default HomePage;
