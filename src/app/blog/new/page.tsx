"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import BackButton from '@/components/blog/new_post/BackButton';
import TitleInput from '@/components/blog/new_post/TitleInput';
import CoverImageInput from '@/components/blog/new_post/CoverImageInput';
import dynamic from 'next/dynamic';
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), { ssr: false });
import ActionButtons from '@/components/blog/new_post/ActionButtons';
import DropdownsSection from '@/components/blog/new_post/DropdownsSection';
import AddTagModal from '@/components/blog/new_post/AddTagModal';

const NewPostPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [authors, setAuthors] = useState<string[]>(["Autor 1"]); // TODO: Fetch from API
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagForm, setShowTagForm] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  
  React.useEffect(() => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setCategories(Object.keys(data));
          // Junta todas as tags de todas as categorias
          const allTags = Object.values(data).flat().map((tag: any) => tag.name);
          setTags(allTags);
        }
      });
  }, []);

  const handleAddAuthor = () => {
    // TODO 
  };
  
  const handleAddTag = () => {
    fetch('/api/tags')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          const allTags = Object.values(data).flat().map((tag: any) => tag.name);
          setTags(allTags);
        }
        setShowTagForm(true);
      });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (image) formData.append('image', image);
      formData.append('author', selectedAuthor);
      formData.append('tags', JSON.stringify(selectedTags));

      const res = await fetch('/api/blog', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Erro ao publicar o post');
      }

      // TODO: popup de sucesso e redirecionar
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      {showTagForm && (
        <AddTagModal
          categories={categories}
          onCreate={(tag, category) => {
            setTags(prev => [...prev, tag]);
            setSelectedTags(prev => [...prev, tag]);
            setShowTagForm(false);
          }}
          onClose={() => setShowTagForm(false)}
        />
      )}
      <div className="flex items-center mb-8">
        <BackButton />
        <h1 className="text-2xl font-bold flex-1">Nova Publicação</h1>
      </div>
      <TitleInput value={title} onChange={e => setTitle(e.target.value)} />
      <CoverImageInput
        image={image}
        onChange={handleImageChange}
        onButtonClick={() => document.getElementById('file-input')?.click()}
      />
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        value={description}
        onEditorChange={setDescription}
        init={{
          menubar: false,
          toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',          license_key: 'gpl',
        }}
        initialValue="Escreve aqui o conteúdo do post..."
      />
      <DropdownsSection
        authors={authors}
        selectedAuthor={selectedAuthor}
        onAuthorChange={setSelectedAuthor}
        onAddAuthor={handleAddAuthor}
        tags={tags}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        onAddTag={handleAddTag}
      />
      <ActionButtons onSave={handleSave} saving={saving} />
    </div>
  );
};

export default NewPostPage;
