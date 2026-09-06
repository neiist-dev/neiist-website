import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DemoCard } from "../components/DemoCard";
import { Modal, Button, Text, Stack } from "@neiist/ui";

export default function ModalDemo() {
  const [openBasic, setOpenBasic] = useState(false);

  return (
    <>
      <PageHeader
        title="Modal"
        description="A dialog component that blocks interaction with the rest of the page."
      />

      <DemoCard
        title="Compound Modal with Sizes"
        description="Modal with compound slots (Header, Body, Footer) and responsive sizing.">
        <Stack direction="row" gap="md" wrap>
          <Button
            variant="outline"
            onClick={() => {
              setOpenBasic(true);
            }}>
            Abrir Modal Composto
          </Button>
        </Stack>

        <Modal open={openBasic} onClose={() => setOpenBasic(false)} size="lg">
          <Modal.Header
            title="Gestão de Sócios"
            subtitle="Configurações e detalhes do núcleo"
            onClose={() => setOpenBasic(false)}
          />
          <Modal.Body>
            <Text>
              O componente Modal suporta composição com subcomponentes e tamanhos pré-definidos (sm,
              md, lg, xl, full, auto) para se ajustar a qualquer caso de uso na aplicação.
            </Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setOpenBasic(false)}>
              Fechar
            </Button>
            <Button variant="solid" color="primary" onClick={() => setOpenBasic(false)}>
              Confirmar
            </Button>
          </Modal.Footer>
        </Modal>
      </DemoCard>
    </>
  );
}
