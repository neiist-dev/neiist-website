"use client";
import React, { useState } from 'react';
import styles from '@/styles/components/blog/newpost-form/NewPostPage.module.css';
import Link from 'next/link';
import BackButton from '@/components/blog/new-post-form/BackButton';
import TitleInput from '@/components/blog/new-post-form/TitleInput';
import CoverImageInput from '@/components/blog/new-post-form/CoverImageInput';
import dynamic from 'next/dynamic';
import ActionButtons from '@/components/blog/new-post-form/ActionButtons';
import DropdownsSection from '@/components/blog/new-post-form/DropdownsSection';
import AddTagModal from '@/components/blog/new-post-form/AddTagModal';
import AddAuthorModal from '@/components/blog/new-post-form/AddAuthorModal';
import PostPreviewModal from '@/components/blog/new-post-form/PostPreviewModal';
import { useSearchParams } from 'next/navigation';
import PostMeta from '@/components/blog/post/PostMeta';
import PostHeader from '@/components/blog/post/PostHeader';
import PostContent from '@/components/blog/post/PostContent';

const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), { ssr: false });

const NewPostPage: React.FC = () => {
  const { useRouter } = require('next/navigation');
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<File | string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [authors, setAuthors] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [tagsByCategory, setTagsByCategory] = useState<Record<string, { id: string, name: string }[]>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagForm, setShowTagForm] = useState(false);
  const [showAuthorForm, setShowAuthorForm] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  React.useEffect(() => {
    fetch('/api/blog/tags')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setCategories(Object.keys(data));
          setTagsByCategory(data);
        }
      });
    fetch('/api/blog/authors')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAuthors(data.map((a: any) => a.name));
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
          setSelectedAuthors(
            Array.isArray(data.authors)
              ? data.authors.map((a: any) => typeof a === 'string' ? a : a.name)
              : (data.author ? [typeof data.author === 'string' ? data.author : data.author.name] : [])
          );
          setSelectedTags(Array.isArray(data.tags) ? data.tags : []);
          if (data.image) setImage(data.image);
        }
      });
    }
  }, [editId]);
  
  const handleAddAuthor = () => {
    setShowAuthorForm(true);
  };

  const handleCreateAuthor = async (author: { name: string; email: string; photo: string | null }) => {
    try {
      const res = await fetch('/api/blog/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(author)
      });
      if (!res.ok) throw new Error('Erro ao criar autor');
      const data = await res.json();
      setAuthors(prev => [...prev, data.name]);
      setSelectedAuthors(prev => [...prev, data.name]);
      setShowAuthorForm(false);
    } catch (e) {
      setToast({ type: 'error', message: 'Erro ao criar autor' });
    }
  };
  
  const handleAddTag = () => {
    fetch('/api/blog/tags')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setTagsByCategory(data);
        }
        setShowTagForm(true);
      });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateFields = () => {
    if (!title.trim() || !description.trim() || selectedAuthors.length === 0 || selectedTags.length === 0) {
      setToast({ type: 'error', message: 'Preenche todos os campos obrigatórios: título, conteúdo, pelo menos um autor e uma tag.' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (image) formData.append('image', image);
      formData.append('authors', JSON.stringify(selectedAuthors));
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
      setTimeout(() => router.push('/blog'), 3000);
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao publicar o post' });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdate = async () => {
    if (!editId) return;
    if (!validateFields()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (image) formData.append('image', image);
      formData.append('authors', JSON.stringify(selectedAuthors));
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
      setTimeout(() => router.push('/blog'), 3000);
    } catch (error) {
      setToast({ type: 'error', message: 'Erro ao atualizar o post' });
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

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
  <div className={styles.container}>
      {showPreview && (
        <PostPreviewModal
          title={title}
          previewImage={previewImage}
          image={image}
          selectedAuthors={selectedAuthors}
          selectedTags={selectedTags}
          description={description}
          onClose={() => setShowPreview(false)}
        />
      )}
      
      {showAuthorForm && (
        <AddAuthorModal
          onCreate={handleCreateAuthor}
          onClose={() => setShowAuthorForm(false)}
        />
      )}
      {showTagForm && (
        <AddTagModal
          onCreate={(tag, category) => {
            fetch('/api/blog/tags')
              .then(res => res.json())
              .then(data => {
                if (data && typeof data === 'object') {
                  setTagsByCategory(data);
                  setSelectedTags(prev => [...prev, tag]);
                }
                setShowTagForm(false);
              });
          }}
          onClose={() => setShowTagForm(false)}
        />
      )}
      <div className={styles.header}>
        <BackButton />
        <h1 className={styles.title}>Nova Publicação</h1>
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
        selectedAuthors={selectedAuthors}
        onAuthorsChange={setSelectedAuthors}
        onAddAuthor={handleAddAuthor}
        tagsByCategory={tagsByCategory}
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
