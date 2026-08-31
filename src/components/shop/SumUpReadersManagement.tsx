"use client";
import { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import styles from "@/styles/components/shop/SumUpReadersManagement.module.css";
import { SumUpReader } from "@/types/sumup";
import ConfirmDialog from "@/components/layout/ConfirmDialog";
import type { Dictionary } from "@/i18n/dictionaries";

interface SumUpReadersManagementProps {
  dict: Dictionary["sumup_readers"];
}

export default function SumUpReadersManagement({ dict }: SumUpReadersManagementProps) {
  const [readers, setReaders] = useState<SumUpReader[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ pairing_code: "", name: "" });
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [readerToDelete, setReaderToDelete] = useState<SumUpReader | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchReaders = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);

    setError(null);
    try {
      const res = await fetch("/api/shop/sumup/readers");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || dict.fetch_error);

      setReaders(data.readers || []);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReaders();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- run once on mount
  }, []);

  const createReader = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setActionMessage(null);

    if (!form.pairing_code.trim() || !form.name.trim()) {
      setError(dict.pairing_code_required);
      return;
    }

    try {
      const res = await fetch("/api/shop/sumup/readers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || dict.create_error);

      setActionMessage(
        `${dict.added_success1}"${data.reader?.name || form.name}" ${dict.added_success2}`
      );
      setForm({ pairing_code: "", name: "" });
      fetchReaders();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const removeReader = async () => {
    setError(null);
    setActionMessage(null);
    setShowConfirm(false);

    const previousReaders = readers;
    if (!readerToDelete) return;

    setReaders((prev) => prev.filter((reader) => reader.id !== readerToDelete.id));

    try {
      const res = await fetch(`/api/shop/sumup/readers/${encodeURIComponent(readerToDelete.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || dict.delete_error);
      }
      setActionMessage(dict.removed_success);
      void fetchReaders({ silent: true });
    } catch (error) {
      setReaders(previousReaders);
      setError((error as Error).message);
    } finally {
      setReaderToDelete(null);
    }
  };

  const handleRemoveReader = async (reader: SumUpReader) => {
    if (!reader) return;

    setReaderToDelete(reader);
    setShowConfirm(true);
  };

  return (
    <div className={styles.readersContainer}>
      <form onSubmit={createReader} className={styles.readersForm}>
        <div className={styles.readersFormGrid}>
          <label>
            {dict.pairing_code_label}
            <input
              type="text"
              value={form.pairing_code}
              onChange={(e) => setForm((prev) => ({ ...prev, pairing_code: e.target.value }))}
              placeholder={dict.pairing_code_placeholder}
              required
            />
          </label>
          <label>
            {dict.reader_name_label}
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={dict.reader_name_placeholder}
              required
            />
          </label>
          <button type="submit" className={styles.primaryButton}>
            {dict.add_button}
          </button>
        </div>
      </form>

      {actionMessage && <div className={styles.successMessage}>{actionMessage}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {loading ? (
        <div className={styles.loadingText}>{dict.loading}</div>
      ) : (
        <div className={styles.readersTableWrapper}>
          <table className={styles.readersTable}>
            <thead>
              <tr>
                <th>{dict.table_id}</th>
                <th>{dict.table_name}</th>
                <th>{dict.table_status}</th>
                <th>{dict.table_model}</th>
                <th>{dict.table_actions}</th>
              </tr>
            </thead>
            <tbody>
              {readers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.readersNoData}>
                    {dict.no_readers}
                  </td>
                </tr>
              ) : (
                readers.map((reader) => (
                  <tr key={reader.id}>
                    <td>{reader.id}</td>
                    <td>{reader.name}</td>
                    <td>{reader.status}</td>
                    <td>{reader.device?.model}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleRemoveReader(reader)}
                        disabled={readerToDelete?.id === reader.id}>
                        <FiTrash2 />
                        {dict.remove_button}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {showConfirm && (
        <ConfirmDialog
          open={showConfirm}
          message={`${dict.remove_button} ${readerToDelete?.name}?`}
          onConfirm={() => removeReader()}
          onCancel={() => {
            setShowConfirm(false);
            setReaderToDelete(null);
          }}
        />
      )}
    </div>
  );
}
