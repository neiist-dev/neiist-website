import React, { useState, useRef } from "react";
import { FaImage } from "react-icons/fa";
import { Button } from "@/components/ui/button";

interface AddAuthorModalProps {
  onCreate: (author: { name: string; email: string; photo: string | null }) => void;
  onClose: () => void;
}

const AddAuthorModal: React.FC<AddAuthorModalProps> = ({ onCreate, onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Preenche todos os campos obrigatórios.");
      return;
    }
    let photoBase64: string | null = null;
    if (photo) {
      photoBase64 = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(photo);
      });
    }
    onCreate({ name: name.trim(), email: email.trim(), photo: photoBase64 });
    setName("");
    setEmail("");
    setPhoto(null);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col items-center">
        <h2 className="text-lg font-bold mb-4">Adicionar Autor</h2>
        <div className="flex flex-col gap-3 w-full">
          <label className="text-sm font-semibold">Nome</label>
          <input
            type="text"
            placeholder="Nome"
            className="px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <label className="text-sm font-semibold">Email</label>
          <input
            type="email"
            placeholder="Email"
            className="px-3 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <label className="text-sm font-semibold">Foto</label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2 cursor-pointer bg-[#2863FD] text-white hover:bg-[#1e4bb8] hover:text-white border-none"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaImage className="text-md" />
              {photo ? "Alterar foto" : "Importar foto"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files ? e.target.files[0] : null;
                setPhoto(file);
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setPhotoPreview(reader.result as string);
                  reader.readAsDataURL(file);
                } else {
                  setPhotoPreview(null);
                }
              }}
            />
          </div>
          {photoPreview && (
            <div className="flex flex-col items-center mt-2">
              <span className="text-xs text-gray-500 mb-1">Pré-visualização:</span>
              <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover border" />
            </div>
          )}
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex gap-2 mt-2 self-end">
            <Button variant="outline" className="px-4 py-2 rounded cursor-pointer" onClick={onClose}>Cancelar</Button>
            <Button variant="default" className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer" onClick={handleCreate}>Adicionar</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAuthorModal;
