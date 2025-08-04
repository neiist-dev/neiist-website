"use client";
import React, { useState } from "react";
import Image from "next/image";
import Activities from "@/components/homepage/Activities";
import styles from "@/styles/pages/ActivitiesManagement.module.css";

function EventsManagementPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!title || !description || !imageFile) {
      setError("Preencha todos os campos.");
      setLoading(false);
      return;
    }

    const imageBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const imageName =
      imageFile.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .replace(/\.jpg$/, "") + ".jpg";

    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, imageBase64, imageName }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setSuccess("Evento criado!");
      setTitle("");
      setDescription("");
      setImageFile(null);
      setImagePreview(null);
    } else {
      setError(data.error || "Erro ao criar evento.");
    }
    setLoading(false);
  };

  return (
    <>
      <h2 className={styles.title}>Gestão de Eventos e Atividades</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputsAndPreview}>
          <div className={styles.inputsCol}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              placeholder="Título"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.input}
              placeholder="Descrição"
              rows={3}
            />
            <label className={styles.fileButton}>
              Escolher Imagem (.jpg)
              <input
                type="file"
                accept=".jpg,image/jpeg"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
            </label>
            {imageFile && <span className={styles.fileName}>{imageFile.name}</span>}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "A criar..." : "Criar Evento"}
            </button>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}
          </div>
          {imagePreview ? (
            <Image
              src={imagePreview}
              alt="Preview"
              width={400}
              height={250}
              className={styles.preview}
            />
          ) : (
            <div className={styles.noImage}>Nenhuma imagem selecionada</div>
          )}
        </div>
      </form>
      <Activities adminPreview />
    </>
  );
}

export default EventsManagementPage;
