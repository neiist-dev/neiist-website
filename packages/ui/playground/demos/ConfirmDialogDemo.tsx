import React, { useState } from "react";
import { DemoCard } from "../components/DemoCard";
import { Button, ConfirmDialog, Stack } from "@neiist/ui";

export const ConfirmDialogDemo = () => {
  const [openStd, setOpenStd] = useState(false);
  const [openDestructive, setOpenDestructive] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  return (
    <Stack gap="lg">
      <DemoCard title="Standard Confirmation">
        <Stack direction="row" gap="md" align="center" wrap>
          <Button onClick={() => setOpenStd(true)}>Open Confirm Dialog</Button>
          {statusMsg && <span>Estado: {statusMsg}</span>}
        </Stack>
        <ConfirmDialog
          open={openStd}
          title="Save Changes"
          message="Are you sure you want to save these changes?"
          confirmLabel="Save"
          cancelLabel="Cancel"
          onCancel={() => setOpenStd(false)}
          onConfirm={() => {
            setStatusMsg("Alterações guardadas com sucesso.");
            setOpenStd(false);
          }}
        />
      </DemoCard>

      <DemoCard title="Destructive Confirmation">
        <Stack direction="row" gap="md" wrap>
          <Button variant="danger" onClick={() => setOpenDestructive(true)}>
            Delete Account
          </Button>
        </Stack>
        <ConfirmDialog
          open={openDestructive}
          title="Delete Account"
          message="This action cannot be undone. All your data will be permanently removed."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isDestructive
          onCancel={() => setOpenDestructive(false)}
          onConfirm={() => {
            setStatusMsg("Conta eliminada com sucesso.");
            setOpenDestructive(false);
          }}
        />
      </DemoCard>
    </Stack>
  );
};
