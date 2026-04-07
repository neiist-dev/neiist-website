"use client";
import { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import styles from "@/styles/components/shop/SumUpReadersManagement.module.css";
import { SumUpReader } from "@/types/sumup";
import ConfirmDialog from "@/components/layout/ConfirmDialog";

export default function SumUpReadersManagement() {
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
      if (!res.ok) throw new Error(data?.error || "Failed to fetch readers");

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
      setError("Pairing code and name are required.");
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
      if (!res.ok) throw new Error(data?.error || "Failed to create reader");

      setActionMessage(`Leitor "${data.reader?.name || form.name}" adicionado com sucesso.`);
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
        throw new Error(data?.error || "Falha ao remover leitor");
      }
      setActionMessage("Leitor removido com sucesso.");
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
            Código de Emparelhamento:
            <input
              type="text"
              value={form.pairing_code}
              onChange={(e) => setForm((prev) => ({ ...prev, pairing_code: e.target.value }))}
              placeholder="Ex: ABCD1234"
              required
            />
          </label>
          <label>
            Nome do Leitor:
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: POS do Bar"
              required
            />
          </label>
          <button type="submit" className={styles.primaryButton}>
            Adicionar Leitor
          </button>
        </div>
      </form>

      {actionMessage && <div className={styles.successMessage}>{actionMessage}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {loading ? (
        <div className={styles.loadingText}>A carregar leitores...</div>
      ) : (
        <div className={styles.readersTableWrapper}>
          <table className={styles.readersTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Estado</th>
                <th>Modelo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {readers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.readersNoData}>
                    Nenhum leitor disponível.
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
                        Remover
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
          message={`Tem a certeza que deseja remover o leitor ${deleteReader?.name}`}
          onConfirm={() => removeReader()}
          onCancel={() => {
            setShowConfirm(false);
            setdeleteReader(null);
          }}
        />
      )}
    </div>
  );
}
