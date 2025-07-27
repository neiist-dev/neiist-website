"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import BackButton from '@/components/blog/new_post/BackButton';
import TitleInput from '@/components/blog/new_post/TitleInput';
import CoverImageInput from '@/components/blog/new_post/CoverImageInput';
import ContentTextarea from '@/components/blog/new_post/ContentTextarea';
import ActionButtons from '@/components/blog/new_post/ActionButtons';

const NewPostPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Publicar post
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
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
      <ContentTextarea value={description} onChange={e => setDescription(e.target.value)} />
      <ActionButtons onSave={handleSave} saving={saving} />
    </div>
  );
};

export default NewPostPage;
