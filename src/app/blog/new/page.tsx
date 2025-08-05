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
import { useSearchParams } from 'next/navigation';
import PostMeta from '@/components/blog/post/PostMeta';
import PostHeader from '@/components/blog/post/PostHeader';
import PostContent from '@/components/blog/post/PostContent';

const NewPostPage: React.FC = () => {
  const { useRouter } = require('next/navigation');
  const router = useRouter();
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
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  
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

  // Quando se clica no botão de editar, fetch dos dados do post
  // e preenche os campos do formulário
  React.useEffect(() => {
    if (editId) {
      fetch(`/api/blog/${editId}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setSelectedAuthor(data.author || '');
          setSelectedTags(Array.isArray(data.tags) ? data.tags : []);
          if (data.image) setImage(data.image);
        }
      });
    }
  }, [editId]);
  
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
        setToast({ type: 'error', message: 'Erro ao publicar o post' });
        throw new Error('Erro ao publicar o post');
      }
      setToast({ type: 'success', message: 'Post publicado com sucesso!' });
      setTimeout(() => router.push('/blog'), 2000);
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao publicar o post' });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdate = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (image) formData.append('image', image);
      formData.append('author', selectedAuthor);
      formData.append('tags', JSON.stringify(selectedTags));
      
      const res = await fetch(`/api/blog/${editId}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!res.ok) {
        setToast({ type: 'error', message: 'Erro ao atualizar o post' });
        throw new Error('Erro ao atualizar o post');
      }
      setToast({ type: 'success', message: 'Post atualizado com sucesso!' });
      setTimeout(() => router.push('/blog'), 2000);
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao atualizar o post' });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Pop up timeout
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      {toast && (
        <div className={`fixed top-20 right-6 z-[100] px-4 py-2 rounded shadow-lg text-white font-semibold transition-all ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}> 
          {toast.message}
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPreview(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl h-[80vh] flex flex-col items-center overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Pré-visualização do Post</h2>
            <div className="w-full overflow-y-auto flex-1">
              <PostMeta author={selectedAuthor} date={new Date().toISOString()} tags={selectedTags} content={description} />
              <PostHeader title={title} image={image || undefined} />
              <PostContent description={description} />
            </div>
            <button
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
              onClick={() => setShowPreview(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
      
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
          toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
          license_key: 'gpl',
        }}
        initialValue={editId ? '' : 'Escreve aqui o conteúdo do post...'}
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
      <ActionButtons 
        onSave={handleSave} 
        onUpdate={handleUpdate} 
        saving={saving} 
        editMode={!!editId} 
        onPreview={handlePreview}
      />
    </div>
  );
};

export default NewPostPage;
