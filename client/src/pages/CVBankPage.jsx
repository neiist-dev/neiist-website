import React, { useState, useEffect, useRef } from "react";
import { FaDownload, FaTrash } from "react-icons/fa";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import style from "./css/CVBankPage.module.css";
import { uploadCV, fetchCVStatus, removeCV, downloadCV } from "../Api.service.js";

const CVBankPage = () => {
  const [hasCV, setHasCV] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    fetchCVStatus()
      .then(data => setHasCV(data.hasCV))
      .catch(() => setHasCV(false));
  }, [refreshFlag]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadCV(file);
      setToast({ success: true, message: "CV enviado com sucesso!" });
      setRefreshFlag(f => !f);
    } catch (err) {
      setToast({ success: false, message: err.message || "Erro ao fazer upload do CV" });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleRemove = async () => {
    try {
      await removeCV();
      setHasCV(false);
      setToast({ success: true, message: "CV removido com sucesso!" });
      setRefreshFlag(f => !f);
    } catch {
      setToast({ success: false, message: "Erro ao remover o CV" });
    }
  };

  const handleDownload = () => {
    window.open("/api/cvbank/download", "_blank");
  };

  return (
    <div className={style.cvBankPage}>
      <h2 className={style.title}>CV-Bank</h2>
      <p className={style.description}>
        Carregue o seu CV para o nosso <b>CV-Bank</b>.<br />
        <span className={style.highlight}>
          O CV-Bank permite que o seu currículo seja partilhado com empresas e oportunidades futuras, que venham a ser proporcionadas pelo NEIIST.
        </span>
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={uploading}
      />
      <Button
        variant="primary"
        onClick={() => fileInputRef.current.click()}
        disabled={uploading}
        className={style.uploadButton}
      >
        {hasCV ? "Atualizar CV" : "Upload CV"}
      </Button>
      {hasCV && (
        <>
          <div className={style.iconRow}>
            <span
              className={style.icon}
              title="Download CV"
              onClick={handleDownload}
            >
              <FaDownload size={28} />
            </span>
            <span
              className={style.icon}
              title="Remover CV"
              onClick={handleRemove}
              style={{ color: "#c0392b" }}
            >
              <FaTrash size={28} />
            </span>
          </div>
        </>
      )}
      {toast && (
        <Alert
          variant={toast.success ? "success" : "danger"}
          onClose={() => setToast(null)}
          dismissible
          className={style.toast}
        >
          {toast.message}
        </Alert>
      )}
    </div>
  );
};

export default CVBankPage;