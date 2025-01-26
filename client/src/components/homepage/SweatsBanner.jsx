import { Center } from "@mantine/core";
import React from "react";
import { Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Banner = () => {
  const navigate = useNavigate();

  return (
    <div onClick={() => navigate("/shop")} className="cursor-pointer w-full">
      <Center>
        <Image
          src="/sweats.png"
          alt="Sweats e Casacos EIC Banner"
          className="w-full"
          // priority
          fluid
        />
      </Center>
    </div>
  );
};

export default Banner;
