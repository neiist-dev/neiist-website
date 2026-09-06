import React from "react";
import { DemoCard } from "../components/DemoCard";
import { Divider, Button, Stack } from "@neiist/ui";

const BREADCRUMB_ITEMS = ["Início", "Atividades", "Sócios"];

export const DividerDemo = () => {
  return (
    <Stack gap="md">
      <DemoCard
        title="Horizontal Divider"
        description="Clean separators with optional middle text label.">
        <Stack style={{ maxWidth: 400 }}>
          <Button fullWidth variant="solid" color="primary">
            Entrar com Fénix Edu
          </Button>
          <Divider label="OU" />
          <Button fullWidth variant="outline">
            Entrar com Email e Palavra-passe
          </Button>
        </Stack>
      </DemoCard>

      <DemoCard
        title="Vertical Divider"
        description="Inline divider separating elements in headers or toolbars.">
        <Stack direction="row" align="center">
          {BREADCRUMB_ITEMS.map((item, idx) => (
            <React.Fragment key={item}>
              {idx > 0 && <Divider orientation="vertical" />}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </Stack>
      </DemoCard>
    </Stack>
  );
};
