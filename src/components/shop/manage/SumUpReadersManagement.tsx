"use client";

import { useEffect, useState } from "react";
import { FiTrash2, FiPlus, FiMoreVertical } from "react-icons/fi";
import {
  Table,
  Button,
  Input,
  Field,
  Badge,
  Modal,
  Stack,
  Text,
  Alert,
  DropdownMenu,
} from "@neiist/ui";
import { SumUpReader } from "@/types/shop/sumup";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/styles/components/shop/manage/SumUpReadersManagement.module.css";

interface SumUpReadersManagementProps {
  dict: Dictionary["sumup_readers"];
}

export default function SumUpReadersManagement({ dict }: SumUpReadersManagementProps) {
  const [readers, setReaders] = useState<SumUpReader[]>([]);
  const [loading, setLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [readerToDelete, setReaderToDelete] = useState<SumUpReader | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchReaders = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);

    try {
      const res = await fetch("/api/shop/sumup/readers");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || dict.fetch_error);
      setReaders(data.readers || []);
    } catch (error) {
      Alert.error((error as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReaders();
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, []);

  const handleCreateReader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode.trim() || !name.trim()) {
      Alert.error(dict.pairing_code_required);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/shop/sumup/readers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairing_code: pairingCode.trim(),
          name: name.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || dict.create_error);

      Alert.success(`${dict.added_success1}"${data.reader?.name || name}" ${dict.added_success2}`);
      setPairingCode("");
      setName("");
      setIsAddModalOpen(false);
      void fetchReaders();
    } catch (error) {
      Alert.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!readerToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shop/sumup/readers/${encodeURIComponent(readerToDelete.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || dict.delete_error);
      }
      Alert.success(dict.removed_success);
      setReaderToDelete(null);
      void fetchReaders({ silent: true });
    } catch (error) {
      Alert.error((error as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Stack direction="column" gap="lg">
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Leitores SumUp (TPA)</h2>
          <p className={styles.description}>
            Terminais físicos associados à conta SumUp do NEIIST.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
          <FiPlus /> {dict.add_button}
        </Button>
      </div>

      {loading ? (
        <Text variant="muted">{dict.loading}</Text>
      ) : readers.length === 0 ? (
        <Text variant="muted">{dict.no_readers}</Text>
      ) : (
        <Table responsive="scroll">
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>{dict.table_id}</Table.HeaderCell>
              <Table.HeaderCell>{dict.table_name}</Table.HeaderCell>
              <Table.HeaderCell>{dict.table_status}</Table.HeaderCell>
              <Table.HeaderCell>{dict.table_model}</Table.HeaderCell>
              <Table.HeaderCell align="right">{""}</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {readers.map((reader) => (
              <Table.Row key={reader.id}>
                <Table.Cell className={styles.monoCell}>{reader.id}</Table.Cell>
                <Table.Cell>
                  <strong>{reader.name}</strong>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    variant={
                      reader.status === "online" || reader.status === "paired"
                        ? "primary"
                        : "secondary"
                    }>
                    {reader.status || "registado"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{reader.device?.model || "-"}</Table.Cell>
                <Table.Cell align="right">
                  <DropdownMenu align="end">
                    <DropdownMenu.Trigger>
                      <Button
                        type="button"
                        variant="ghost"
                        color="neutral"
                        size="icon"
                        aria-label="Ações do leitor">
                        <FiMoreVertical size={16} />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end" mobileTitle="Ações do Leitor">
                      <DropdownMenu.Item
                        destructive
                        icon={<FiTrash2 size={14} />}
                        onClick={() => setReaderToDelete(reader)}>
                        {dict.remove_button}
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {isAddModalOpen && (
        <Modal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Emparelhar Leitor SumUp"
          size="md">
          <form onSubmit={handleCreateReader}>
            <Stack direction="column" gap="md" className={styles.modalStack}>
              <Field label={dict.pairing_code_label}>
                <Input
                  type="text"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  placeholder={dict.pairing_code_placeholder}
                  autoFocus
                  required
                />
              </Field>
              <Field label={dict.reader_name_label}>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={dict.reader_name_placeholder}
                  required
                />
              </Field>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || !pairingCode.trim() || !name.trim()}>
                  {submitting ? "A emparelhar..." : dict.add_button}
                </Button>
              </div>
            </Stack>
          </form>
        </Modal>
      )}

      <Modal
        open={Boolean(readerToDelete)}
        onClose={() => setReaderToDelete(null)}
        title="Remover Leitor SumUp"
        size="sm">
        <Stack direction="column" gap="md" className={styles.confirmStack}>
          <Text>
            Tens a certeza que desejas desemparelhar e remover o leitor{" "}
            <strong>{readerToDelete?.name}</strong> ({readerToDelete?.id})?
          </Text>
          <Stack direction="row" justify="end" gap="sm">
            <Button variant="outline" onClick={() => setReaderToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" disabled={deleting} onClick={handleConfirmDelete}>
              {deleting ? "A remover..." : "Confirmar Remoção"}
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </Stack>
  );
}
