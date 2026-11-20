"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCopy, FiEdit2, FiInfo, FiPlus, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DetailCard,
  DropdownMenu,
  Field,
  Heading,
  Input,
  InputDialog,
  Modal,
  Spinner,
  Stack,
  Text,
  type BadgeProps,
  type ColumnDef,
  type DetailCardMetaItem,
} from "@neiist/ui";
import type { Dictionary } from "@/i18n/dictionaries";
import { SumUpReader } from "@/types/shop/sumup";

interface SumUpReadersManagementProps {
  dict: Dictionary["sumup_readers"];
}

function getStatusBadgeVariant(status?: string): BadgeProps["variant"] {
  switch (status) {
    case "paired":
    case "online":
      return "primary";
    case "expired":
      return "danger";
    case "processing":
      return "secondary";
    default:
      return "outline";
  }
}

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-PT");
}

export default function SumUpReadersManagement({ dict }: SumUpReadersManagementProps) {
  const [readers, setReaders] = useState<SumUpReader[]>([]);
  const [loading, setLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReader, setSelectedReader] = useState<SumUpReader | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [readerToRename, setReaderToRename] = useState<SumUpReader | null>(null);
  const [readerToDelete, setReaderToDelete] = useState<SumUpReader | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReaders = useCallback(
    async (opts?: { silent?: boolean }) => {
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
    },
    [dict.fetch_error]
  );

  useEffect(() => {
    void fetchReaders();
  }, [fetchReaders]);

  const handleOpenDetails = useCallback(
    async (reader: SumUpReader) => {
      setSelectedReader(reader);
      setLoadingDetails(true);
      try {
        const res = await fetch(`/api/shop/sumup/readers/${encodeURIComponent(reader.id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || dict.fetch_error);
        if (data.reader) {
          const updated = data.reader as SumUpReader;
          setSelectedReader(updated);
          setReaders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        }
      } catch (error) {
        Alert.error((error as Error).message);
      } finally {
        setLoadingDetails(false);
      }
    },
    [dict.fetch_error]
  );

  const handleCopyId = useCallback(
    async (readerId: string) => {
      try {
        await navigator.clipboard.writeText(readerId);
        Alert.success(dict.id_copied);
      } catch {
        Alert.error(dict.copy_error);
      }
    },
    [dict.id_copied, dict.copy_error]
  );

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
      void fetchReaders({ silent: true });
    } catch (error) {
      Alert.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenameReader = async (newName: string) => {
    if (!readerToRename) return;
    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName === readerToRename.name) {
      setReaderToRename(null);
      return;
    }

    try {
      const res = await fetch(`/api/shop/sumup/readers/${encodeURIComponent(readerToRename.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || dict.update_error);

      const updated = (data.reader as SumUpReader) || {
        ...readerToRename,
        name: trimmedName,
      };
      setReaders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedReader((prev) => (prev?.id === updated.id ? updated : prev));
      setReaderToRename(null);
      Alert.success(dict.rename_success);
    } catch (error) {
      Alert.error((error as Error).message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!readerToDelete || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shop/sumup/readers/${encodeURIComponent(readerToDelete.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || dict.delete_error);
      }
      const deletedId = readerToDelete.id;
      setReaders((prev) => prev.filter((r) => r.id !== deletedId));
      setSelectedReader((prev) => (prev?.id === deletedId ? null : prev));
      setReaderToDelete(null);
      Alert.success(dict.removed_success);
      void fetchReaders({ silent: true });
    } catch (error) {
      Alert.error((error as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<SumUpReader>[]>(
    () => [
      {
        id: "name",
        header: dict.table_name,
        dataLabel: dict.table_name,
        isCardHeader: true,
        cell: (reader) => <strong>{reader.name}</strong>,
      },
      {
        id: "status",
        header: dict.table_status,
        dataLabel: dict.table_status,
        cell: (reader) => (
          <Badge variant={getStatusBadgeVariant(reader.status)}>{reader.status || "unknown"}</Badge>
        ),
      },
      {
        id: "model",
        header: dict.table_model,
        dataLabel: dict.table_model,
        cell: (reader) => reader.device?.model || "—",
      },
    ],
    [dict.table_model, dict.table_name, dict.table_status]
  );

  const renderReaderMenuItems = useCallback(
    (reader: SumUpReader) => (
      <>
        <DropdownMenu.Item
          icon={<FiInfo size={14} />}
          onClick={() => void handleOpenDetails(reader)}>
          {dict.view_details}
        </DropdownMenu.Item>
        <DropdownMenu.Item icon={<FiEdit2 size={14} />} onClick={() => setReaderToRename(reader)}>
          {dict.rename_button}
        </DropdownMenu.Item>
        <DropdownMenu.Item icon={<FiCopy size={14} />} onClick={() => void handleCopyId(reader.id)}>
          {dict.copy_id}
        </DropdownMenu.Item>
        <DropdownMenu.Divider />
        <DropdownMenu.Item
          destructive
          icon={<FiTrash2 size={14} />}
          onClick={() => setReaderToDelete(reader)}>
          {dict.remove_button}
        </DropdownMenu.Item>
      </>
    ),
    [
      dict.copy_id,
      dict.remove_button,
      dict.rename_button,
      dict.view_details,
      handleCopyId,
      handleOpenDetails,
    ]
  );

  const detailMetadata = useMemo<DetailCardMetaItem[]>(() => {
    if (!selectedReader) return [];
    const items: DetailCardMetaItem[] = [
      {
        id: "id",
        label: dict.detail_id,
        value: <code>{selectedReader.id}</code>,
      },
      {
        id: "model",
        label: dict.detail_model,
        value: selectedReader.device?.model || "—",
      },
      {
        id: "serial",
        label: dict.detail_serial,
        value: selectedReader.device?.identifier || "—",
      },
    ];
    if (selectedReader.service_account_id) {
      items.push({
        id: "service_account",
        label: dict.detail_service_account,
        value: <code>{selectedReader.service_account_id}</code>,
      });
    }
    if (selectedReader.created_at) {
      items.push({
        id: "created_at",
        label: dict.detail_created_at,
        value: formatDateTime(selectedReader.created_at),
      });
    }
    if (selectedReader.updated_at) {
      items.push({
        id: "updated_at",
        label: dict.detail_updated_at,
        value: formatDateTime(selectedReader.updated_at),
      });
    }
    if (selectedReader.metadata && Object.keys(selectedReader.metadata).length > 0) {
      items.push({
        id: "metadata",
        label: dict.detail_metadata,
        value: <code>{JSON.stringify(selectedReader.metadata)}</code>,
      });
    }
    return items;
  }, [dict, selectedReader]);

  return (
    <Stack direction="column" gap="lg">
      <Stack direction="row" justify="between" align="center" gap="md" wrap>
        <Stack direction="column" gap="sm">
          <Heading level={3}>{dict.title}</Heading>
          <Text size="sm" variant="muted">
            {dict.subtitle}
          </Text>
        </Stack>
        <Stack direction="row" gap="sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchReaders()}
            disabled={loading}>
            <FiRefreshCw /> {dict.refresh_button}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <FiPlus /> {dict.add_button}
          </Button>
        </Stack>
      </Stack>

      {loading && readers.length === 0 ? (
        <Stack direction="row" align="center" gap="sm">
          <Spinner size="sm" />
          <Text variant="muted">{dict.loading}</Text>
        </Stack>
      ) : (
        <DataTable
          data={readers}
          columns={columns}
          getRowId={(reader) => reader.id}
          onRowClick={(reader) => void handleOpenDetails(reader)}
          rowActions={renderReaderMenuItems}
          actionsTitle={dict.actions_title}
          emptyMessage={dict.no_readers}
          responsive="cards"
        />
      )}

      {isAddModalOpen && (
        <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} size="md">
          <Modal.Header title={dict.pair_modal_title} onClose={() => setIsAddModalOpen(false)} />
          <form onSubmit={handleCreateReader}>
            <Modal.Body>
              <Stack direction="column" gap="md">
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
              </Stack>
            </Modal.Body>
            <Modal.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={submitting}>
                {dict.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                disabled={submitting || !pairingCode.trim() || !name.trim()}>
                {dict.add_button}
              </Button>
            </Modal.Footer>
          </form>
        </Modal>
      )}

      {selectedReader && (
        <Modal open={Boolean(selectedReader)} onClose={() => setSelectedReader(null)} size="md">
          <Modal.Header title={dict.details_title} onClose={() => setSelectedReader(null)} />
          <Modal.Body>
            <Stack direction="column" gap="md">
              <DetailCard
                title={selectedReader.name}
                badge={
                  <Badge variant={getStatusBadgeVariant(selectedReader.status)}>
                    {selectedReader.status || "unknown"}
                  </Badge>
                }
                metadata={detailMetadata}
              />
              {loadingDetails && (
                <Stack direction="row" align="center" gap="sm">
                  <Spinner size="sm" />
                  <Text size="sm" variant="muted">
                    {dict.loading}
                  </Text>
                </Stack>
              )}
            </Stack>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="warning"
              onClick={() => {
                const current = selectedReader;
                setSelectedReader(null);
                setReaderToDelete(current);
              }}>
              <FiTrash2 /> {dict.remove_button}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                const current = selectedReader;
                setSelectedReader(null);
                setReaderToRename(current);
              }}>
              <FiEdit2 /> {dict.rename_button}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <InputDialog
        open={Boolean(readerToRename)}
        title={dict.rename_title}
        label={dict.reader_name_label}
        initialValue={readerToRename?.name ?? ""}
        placeholder={dict.reader_name_placeholder}
        confirmLabel={dict.rename_confirm}
        cancelLabel={dict.cancel}
        onConfirm={(value) => void handleRenameReader(value)}
        onCancel={() => setReaderToRename(null)}
      />

      <ConfirmDialog
        open={Boolean(readerToDelete)}
        title={dict.remove_confirm_title}
        message={
          <>
            {dict.remove_confirm_message} <strong>{readerToDelete?.name}</strong>?
          </>
        }
        cancelLabel={dict.cancel}
        confirmLabel={deleting ? dict.removing : dict.remove_confirm_button}
        isDestructive
        onCancel={() => setReaderToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </Stack>
  );
}
