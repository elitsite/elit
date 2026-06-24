'use client';

import { useState, useRef } from 'react';
import { Save, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import type { EventContent, LocalizedText, EventSection, PortfolioItem } from '@/lib/supabase';

interface EventEditorProps {
    slug: 'weddings' | 'parties';
    content: EventContent;
    adminLang: 'ru' | 'en';
    at: Record<string, string>;
    uploadImage: (file: File) => Promise<string>;
    onSave: (slug: string, content: EventContent) => Promise<void>;
}

const emptyContent: EventContent = {
    hero_image: '', hero_title: {}, hero_subtitle: {},
    intro_kicker: {}, intro_title: {}, intro_text: {}, intro_button: {},
    media_image: '',
    sections: [],
    quote_image: '', quote_kicker: {}, quote_text: {}, quote_author: {},
    portfolio_kicker: {}, portfolio_title: {},
    portfolio: [],
    gallery: [],
    form_title: {},
};

export default function EventEditor({ slug, content: initialContent, at, uploadImage, onSave }: EventEditorProps) {
    const [content, setContent] = useState<EventContent>({ ...emptyContent, ...initialContent });
    const [saving, setSaving] = useState(false);

    // ── Helpers ──
    const setField = <K extends keyof EventContent>(key: K, value: EventContent[K]) => {
        setContent(prev => ({ ...prev, [key]: value }));
    };

    const setLocalized = (key: keyof EventContent, lang: 'en' | 'uk' | 'nl', value: string) => {
        setContent(prev => ({
            ...prev,
            [key]: { ...(prev[key] as LocalizedText), [lang]: value },
        }));
    };

    const getLocalized = (key: keyof EventContent, lang: 'en' | 'uk' | 'nl'): string => {
        const field = content[key] as LocalizedText | undefined;
        return field?.[lang] || '';
    };

    // ── Image upload ──
    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        onDone: (url: string) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return;
        try {
            const url = await uploadImage(file);
            onDone(url);
        } catch { /* no-op */ }
        e.target.value = '';
    };

    // ── Sections array helpers ──
    const addSection = () => {
        const newSection: EventSection = { image: '', title: {}, text: {} };
        setField('sections', [...(content.sections || []), newSection]);
    };

    const updateSection = (i: number, field: keyof EventSection, value: string | LocalizedText) => {
        const sections = [...(content.sections || [])];
        sections[i] = { ...sections[i], [field]: value };
        setField('sections', sections);
    };

    const removeSection = (i: number) => {
        const sections = (content.sections || []).filter((_, idx) => idx !== i);
        setField('sections', sections);
    };

    const setSectionLocalized = (i: number, field: 'title' | 'text', lang: 'en' | 'uk' | 'nl', value: string) => {
        const sections = [...(content.sections || [])];
        sections[i] = { ...sections[i], [field]: { ...sections[i][field], [lang]: value } };
        setField('sections', sections);
    };

    // ── Portfolio array helpers ──
    const addPortfolio = () => {
        const item: PortfolioItem = { image: '', caption: {} };
        setField('portfolio', [...(content.portfolio || []), item]);
    };

    const updatePortfolio = (i: number, field: keyof PortfolioItem, value: string | LocalizedText) => {
        const portfolio = [...(content.portfolio || [])];
        portfolio[i] = { ...portfolio[i], [field]: value };
        setField('portfolio', portfolio);
    };

    const removePortfolio = (i: number) => {
        setField('portfolio', (content.portfolio || []).filter((_, idx) => idx !== i));
    };

    const setPortfolioLocalized = (i: number, lang: 'en' | 'uk' | 'nl', value: string) => {
        const portfolio = [...(content.portfolio || [])];
        portfolio[i] = { ...portfolio[i], caption: { ...portfolio[i].caption, [lang]: value } };
        setField('portfolio', portfolio);
    };

    // ── Gallery helpers ──
    const addGalleryImage = (url: string) => {
        setField('gallery', [...(content.gallery || []), url]);
    };

    const removeGalleryImage = (i: number) => {
        setField('gallery', (content.gallery || []).filter((_, idx) => idx !== i));
    };

    // ── Save ──
    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(slug, content);
        } finally {
            setSaving(false);
        }
    };

    // ── Reusable UI bits ──
    const LangInputs = ({ label, fieldKey }: { label: string; fieldKey: keyof EventContent }) => (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div className="space-y-2">
                {(['en', 'uk', 'nl'] as const).map(lang => (
                    <input
                        key={lang}
                        type="text"
                        value={getLocalized(fieldKey, lang)}
                        onChange={e => setLocalized(fieldKey, lang, e.target.value)}
                        placeholder={at[`events_lang_${lang}`]}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                    />
                ))}
            </div>
        </div>
    );

    const ImageUpload = ({ url, onUpload, label }: { url: string; onUpload: (url: string) => void; label: string }) => {
        const ref = useRef<HTMLInputElement>(null);
        return (
            <div>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <div
                    onClick={() => ref.current?.click()}
                    className="relative border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-amber-400 bg-zinc-50"
                    style={{ minHeight: '120px' }}
                >
                    <input ref={ref} type="file" accept="image/*" onChange={e => handleImageUpload(e, onUpload)} className="hidden" />
                    {url ? (
                        <div className="relative">
                            <img src={url} alt="" className="w-full h-32 object-cover rounded-lg" />
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); onUpload(''); }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
                            <Upload size={24} />
                            <span className="text-xs mt-2">{at.form_photo_click}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const cardClass = "bg-white rounded-xl p-3 sm:p-6 shadow-lg";

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-4">{at.events_hero}</h3>
                <div className="space-y-4">
                    <ImageUpload url={content.hero_image || ''} onUpload={url => setField('hero_image', url)} label={at.events_hero_image} />
                    <LangInputs label={at.events_hero_title} fieldKey="hero_title" />
                    <LangInputs label={at.events_hero_subtitle} fieldKey="hero_subtitle" />
                </div>
            </div>

            {/* Intro */}
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-4">{at.events_intro}</h3>
                <div className="space-y-4">
                    <LangInputs label={at.events_kicker} fieldKey="intro_kicker" />
                    <LangInputs label={at.events_title_field} fieldKey="intro_title" />
                    <LangInputs label={at.events_text} fieldKey="intro_text" />
                    <LangInputs label={at.events_button} fieldKey="intro_button" />
                </div>
            </div>

            {/* Media */}
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-4">{at.events_media}</h3>
                <ImageUpload url={content.media_image || ''} onUpload={url => setField('media_image', url)} label={at.events_media_image} />
            </div>

            {/* Sections */}
            <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{at.events_sections}</h3>
                    <button onClick={addSection} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> {at.events_add_section}
                    </button>
                </div>
                <div className="space-y-6">
                    {(content.sections || []).map((section, i) => (
                        <div key={i} className="border border-zinc-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-zinc-500">#{i + 1}</span>
                                <button onClick={() => removeSection(i)} className="text-red-500 hover:text-red-600">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <ImageUpload url={section.image} onUpload={url => updateSection(i, 'image', url)} label={at.events_section_image} />
                            <div>
                                <label className="block text-sm font-medium mb-1">{at.events_title_field}</label>
                                <div className="space-y-2">
                                    {(['en', 'uk', 'nl'] as const).map(lang => (
                                        <input
                                            key={lang}
                                            type="text"
                                            value={section.title?.[lang] || ''}
                                            onChange={e => setSectionLocalized(i, 'title', lang, e.target.value)}
                                            placeholder={at[`events_lang_${lang}`]}
                                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{at.events_text}</label>
                                <div className="space-y-2">
                                    {(['en', 'uk', 'nl'] as const).map(lang => (
                                        <textarea
                                            key={lang}
                                            value={section.text?.[lang] || ''}
                                            onChange={e => setSectionLocalized(i, 'text', lang, e.target.value)}
                                            placeholder={at[`events_lang_${lang}`]}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quote */}
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-4">{at.events_quote}</h3>
                <div className="space-y-4">
                    <ImageUpload url={content.quote_image || ''} onUpload={url => setField('quote_image', url)} label={at.events_quote_image} />
                    <LangInputs label={at.events_quote_kicker} fieldKey="quote_kicker" />
                    <LangInputs label={at.events_quote_text} fieldKey="quote_text" />
                    <LangInputs label={at.events_quote_author} fieldKey="quote_author" />
                </div>
            </div>

            {/* Portfolio */}
            <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{at.events_portfolio}</h3>
                    <button onClick={addPortfolio} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> {at.events_add_portfolio}
                    </button>
                </div>
                <div className="space-y-3 mb-4">
                    <LangInputs label={at.events_portfolio_kicker} fieldKey="portfolio_kicker" />
                    <LangInputs label={at.events_portfolio_title} fieldKey="portfolio_title" />
                </div>
                <div className="space-y-6">
                    {(content.portfolio || []).map((item, i) => (
                        <div key={i} className="border border-zinc-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-zinc-500">#{i + 1}</span>
                                <button onClick={() => removePortfolio(i)} className="text-red-500 hover:text-red-600">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <ImageUpload url={item.image} onUpload={url => updatePortfolio(i, 'image', url)} label={at.events_portfolio_image} />
                            <div>
                                <label className="block text-sm font-medium mb-1">{at.events_portfolio_caption}</label>
                                <div className="space-y-2">
                                    {(['en', 'uk', 'nl'] as const).map(lang => (
                                        <input
                                            key={lang}
                                            type="text"
                                            value={item.caption?.[lang] || ''}
                                            onChange={e => setPortfolioLocalized(i, lang, e.target.value)}
                                            placeholder={at[`events_lang_${lang}`]}
                                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gallery */}
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-4">{at.events_gallery}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {(content.gallery || []).map((img, i) => (
                        <div key={i} className="relative">
                            <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
                            <button
                                onClick={() => removeGalleryImage(i)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    <GalleryUploader onUpload={addGalleryImage} uploadImage={uploadImage} label={at.events_add_gallery} />
                </div>
            </div>

            {/* Form */}
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-4">{at.events_form}</h3>
                <LangInputs label={at.events_form_title} fieldKey="form_title" />
            </div>

            {/* Save button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {at.events_btn_save}
                </button>
            </div>
        </div>
    );
}

// ── Gallery uploader (inline add button) ──
function GalleryUploader({
    onUpload,
    uploadImage,
    label,
}: {
    onUpload: (url: string) => void;
    uploadImage: (file: File) => Promise<string>;
    label: string;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return;
        try {
            const url = await uploadImage(file);
            onUpload(url);
        } catch { /* no-op */ }
        e.target.value = '';
    };

    return (
        <div
            onClick={() => ref.current?.click()}
            className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-amber-400 text-zinc-400"
        >
            <input ref={ref} type="file" accept="image/*" onChange={handle} className="hidden" />
            <Plus size={20} />
            <span className="text-xs mt-1">{label}</span>
        </div>
    );
}
