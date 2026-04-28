"use client";
import { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import styles from "@/styles/components/shop/SumUpReadersManagement.module.css";
import { SumUpReader } from "@/types/sumup";
import ConfirmDialog from "@/components/layout/ConfirmDialog";

interface SumUpReadersManagementProps {
  dict: {
    sumup_readers: {
      pairing_code_label: string;
      pairing_code_placeholder: string;
      reader_name_label: string;
      reader_name_placeholder: string;
      add_button: string;
      loading: string;
      no_readers: string;
      remove_button: string;
      added_success1: string;
      added_success2: string;
      removed_success: string;
      pairing_code_required: string;
      table_id: string;
      table_name: string;
      table_status: string;
      table_model: string;
      table_actions: string;
      fetch_error: string;
      create_error: string;
      delete_error: string;
    };
    confirm_dialog: {
      title: string;
      confirm: string;
      cancel: string;
    };
  };
}
export default function SumUpReadersManagement( {dict}: SumUpReadersManagementProps) {
  const [readers, setReaders] = useState<SumUpReader[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ pairing_code: "", name: "" });
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [deleteReader, setdeleteReader] = useState<SumUpReader | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchReaders = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);

    setError(null);
    try {
      const res = await fetch("/api/shop/sumup/readers");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || dict.sumup_readers.fetch_error);

      setReaders(data.readers || []);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReaders();
  }, []);

  const createReader = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setActionMessage(null);

    if (!form.pairing_code.trim() || !form.name.trim()) {
      setError(dict.sumup_readers.pairing_code_required);
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
      if (!res.ok) throw new Error(data?.error || dict.sumup_readers.create_error);

      setActionMessage(`${dict.sumup_readers.added_success1} "${data.reader?.name || form.name}" ${dict.sumup_readers.added_success2}`);
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
    if (!deleteReader) return;

    setReaders((prev) => prev.filter((reader) => reader.id !== deleteReader.id));

    try {
      const res = await fetch(`/api/shop/sumup/readers/${encodeURIComponent(deleteReader.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || dict.sumup_readers.delete_error);
      }
      setActionMessage(dict.sumup_readers.removed_success);
      void fetchReaders({ silent: true });
    } catch (error) {
      setReaders(previousReaders);
      setError((error as Error).message);
    } finally {
      setdeleteReader(null);
    }
  };

  const handleRemoveReader = async (reader: SumUpReader) => {
    if (!reader) return;

    setdeleteReader(reader);
    setShowConfirm(true);
  };

  return (
    <div className={styles.readersContainer}>
      <form onSubmit={createReader} className={styles.readersForm}>
        <div className={styles.readersFormGrid}>
          <label>
            {dict.sumup_readers.pairing_code_label}
            <input
              type="text"
              value={form.pairing_code}
              onChange={(e) => setForm((prev) => ({ ...prev, pairing_code: e.target.value }))}
              placeholder={dict.sumup_readers.pairing_code_placeholder}
              required
            />
          </label>
          <label>
            {dict.sumup_readers.reader_name_label}
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={dict.sumup_readers.reader_name_placeholder}
              required
            />
          </label>
          <button type="submit" className={styles.primaryButton}>
            {dict.sumup_readers.add_button}
          </button>
        </div>
      </form>

      {actionMessage && <div className={styles.successMessage}>{actionMessage}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {loading ? (
        <div className={styles.loadingText}>{dict.sumup_readers.loading}</div>
      ) : (
        <div className={styles.readersTableWrapper}>
          <table className={styles.readersTable}>
            <thead>
              <tr>
                <th>{dict.sumup_readers.table_id}</th>
                <th>{dict.sumup_readers.table_name}</th>
                <th>{dict.sumup_readers.table_status}</th>
                <th>{dict.sumup_readers.table_model}</th>
                <th>{dict.sumup_readers.table_actions}</th>
              </tr>
            </thead>
            <tbody>
              {readers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.readersNoData}>
                    {dict.sumup_readers.no_readers}
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
                        disabled={deleteReader?.id === reader.id}>
                        <FiTrash2 />
                        {dict.sumup_readers.remove_button}
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
          message={`${dict.confirm_dialog.title} ${deleteReader?.name}`}
          onConfirm={() => removeReader()}
          onCancel={() => {
            setShowConfirm(false);
            setdeleteReader(null);
          }}
          dict = {dict.confirm_dialog}
        />
      )}
    </div>
  );
}
