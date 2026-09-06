import React from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Container, Stack } from "@neiist/ui";

export default function ContainerDemo() {
  const sizes = ["sm", "md", "lg", "xl"] as const;

  return (
    <>
      <PageHeader
        title="Container"
        description="Documentation and examples for the Container component."
      />

      <DemoCard title="Basic">
        <Stack gap="lg">
          {sizes.map((size) => (
            <Container
              key={size}
              size={size}
              style={{ background: "var(--ui-bg-hover)", padding: "2rem", borderRadius: 8 }}>
              <p style={{ margin: 0, textAlign: "center" }}>Container {size.toUpperCase()}</p>
            </Container>
          ))}
        </Stack>
      </DemoCard>
    </>
  );
}
