'use client';

import { useState, useRef, useCallback } from 'react';
import { Save, Loader2, Plus, Trash2, Upload, X, Languages } from 'lucide-react';
import type { EventContent, LocalizedText, EventSection, PortfolioItem, ProcessStep } from '@/lib/supabase';

/* ================================================================
 *  Sub-components defined OUTSIDE of EventEditor to avoid
 *  re-creation on every render (which causes input focus loss).
 * ================================================================ */

// ── Section divider ──
function SectionHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-zinc-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{title}</span>
            <div className="h-px flex-1 bg-zinc-300" />
        </div>
    );
}

// ── Localized text inputs (EN / UK / NL) ──
function LangInputs({
    label,
    value,
    onChange,
    at,
    multiline,
}: {
    label: string;
    value: LocalizedText;
    onChange: (lang: 'en' | 'uk' | 'nl', val: string) => void;
    at: Record<string, string>;
    multiline?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div className="space-y-2">
                {(['en', 'uk', 'nl'] as const).map(lang =>
                    multiline ? (
                        <textarea
                            key={lang}
                            value={value?.[lang] || ''}
                            onChange={e => onChange(lang, e.target.value)}
                            placeholder={at[`events_lang_${lang}`]}
                            rows={3}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-none"
                        />
                    ) : (
                        <input
                            key={lang}
                            type="text"
                            value={value?.[lang] || ''}
                            onChange={e => onChange(lang, e.target.value)}
                            placeholder={at[`events_lang_${lang}`]}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                        />
                    )
                )}
            </div>
        </div>
    );
}

// ── Image uploader ──
function ImageUploadField({
    url,
    onUpload,
    label,
    uploadImage,
    clickLabel,
    sizeHint,
}: {
    url: string;
    onUpload: (url: string) => void;
    label: string;
    uploadImage: (file: File) => Promise<string>;
    clickLabel: string;
    sizeHint?: string;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return;
        try {
            const u = await uploadImage(file);
            onUpload(u);
        } catch { /* no-op */ }
        e.target.value = '';
    };

    return (
        <div>
            <label className="block text-sm font-medium mb-1">
                {label}
                {sizeHint && (
                    <span className="ml-2 inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full align-middle">
                        📐 {sizeHint}
                    </span>
                )}
            </label>
            <div
                onClick={() => ref.current?.click()}
                className="relative border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:border-amber-400 bg-zinc-50"
                style={{ minHeight: '120px' }}
            >
                <input ref={ref} type="file" accept="image/*" onChange={handleChange} className="hidden" />
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
                        <span className="text-xs mt-2">{clickLabel}</span>
                        {sizeHint && <span className="text-[10px] mt-1 text-zinc-300">{sizeHint}</span>}
                    </div>
                )}
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


/* ================================================================
 *  Main EventEditor
 * ================================================================ */

interface EventEditorProps {
    slug: 'weddings' | 'events';
    content: EventContent;
    adminLang: 'ru' | 'en';
    at: Record<string, string>;
    uploadImage: (file: File) => Promise<string>;
    onSave: (slug: string, content: EventContent) => Promise<void>;
}

const emptyContent: EventContent = {
    // Core hero
    hero_image: '', hero_title: {}, hero_subtitle: {},
    hero_kicker: {}, hero_button: {},
    // Intro
    intro_kicker: {}, intro_title: {}, intro_text: {}, intro_button: {},
    intro_text_col2: {},
    // Media / framed (parties)
    media_image: '', sections: [],
    // Full service (weddings)
    full_service_image: '', full_service_title: {}, full_service_text: {},
    full_service_included: {}, full_service_included_label: {},
    // Other services (weddings)
    other_services_kicker: {}, other_services_image: '',
    service1_title: {}, service1_text: {}, service1_italic: {}, service1_cta: {},
    service2_title: {}, service2_text: {}, service2_italic: {}, service2_cta: {},
    // Final choices (weddings)
    final_choices_title: {}, final_choices_text: {}, final_choices_link: {},
    // Quote
    quote_image: '', quote_kicker: {}, quote_text: {}, quote_author: {},
    // Portfolio
    portfolio_kicker: {}, portfolio_title: {}, portfolio: [],
    portfolio_sidebar_text: {},
    // Packages / decor (parties)
    packages_kicker: {}, packages_title: {}, packages: [],
    decor_kicker: {}, decor_title: {}, decor: [],
    // Bloom (weddings)
    bloom_image: '', bloom_kicker: {}, bloom_title: {}, bloom_text: {}, bloom_button: {},
    // CTA (weddings)
    cta_title: {}, cta_text: {}, cta_button: {},
    // Gallery & form
    gallery: [], form_title: {},
    process_steps: [],
    slider_images: [],
};

export default function EventEditor({ slug, content: initialContent, at, uploadImage, onSave }: EventEditorProps) {
    const [content, setContent] = useState<EventContent>({ ...emptyContent, ...initialContent });
    const [saving, setSaving] = useState(false);
    const [translating, setTranslating] = useState(false);

    // ── Helpers ──
    const setField = <K extends keyof EventContent>(key: K, value: EventContent[K]) => {
        setContent(prev => ({ ...prev, [key]: value }));
    };

    const handleLocalizedChange = useCallback((key: keyof EventContent, lang: 'en' | 'uk' | 'nl', value: string) => {
        setContent(prev => ({
            ...prev,
            [key]: { ...(prev[key] as LocalizedText), [lang]: value },
        }));
    }, []);

    const getLocalized = (key: keyof EventContent): LocalizedText => {
        return (content[key] as LocalizedText) || {};
    };

    // ── Sections array helpers ──
    const addSection = () => {
        const newSection: EventSection = { image: '', title: {}, text: {} };
        setField('sections', [...(content.sections || []), newSection]);
    };

    const updateSectionImage = useCallback((i: number, url: string) => {
        setContent(prev => {
            const sections = [...(prev.sections || [])];
            sections[i] = { ...sections[i], image: url };
            return { ...prev, sections };
        });
    }, []);

    const removeSection = (i: number) => {
        const sections = (content.sections || []).filter((_, idx) => idx !== i);
        setField('sections', sections);
    };

    const handleSectionLocalizedChange = useCallback((i: number, field: 'title' | 'text', lang: 'en' | 'uk' | 'nl', value: string) => {
        setContent(prev => {
            const sections = [...(prev.sections || [])];
            sections[i] = { ...sections[i], [field]: { ...sections[i][field], [lang]: value } };
            return { ...prev, sections };
        });
    }, []);

    // ── Generic items array helpers (portfolio / packages / decor) ──
    const addItem = (key: 'portfolio' | 'packages' | 'decor') => {
        const item: PortfolioItem = { image: '', caption: {} };
        setField(key, [...(content[key] || []), item]);
    };

    const handleItemImageChange = useCallback((key: 'portfolio' | 'packages' | 'decor', i: number, url: string) => {
        setContent(prev => {
            const items = [...(prev[key] || [])];
            items[i] = { ...items[i], image: url };
            return { ...prev, [key]: items };
        });
    }, []);

    const removeItem = (key: 'portfolio' | 'packages' | 'decor', i: number) => {
        setField(key, (content[key] || []).filter((_, idx) => idx !== i));
    };

    const handleItemLocalizedChange = useCallback((key: 'portfolio' | 'packages' | 'decor', i: number, lang: 'en' | 'uk' | 'nl', value: string) => {
        setContent(prev => {
            const items = [...(prev[key] || [])];
            items[i] = { ...items[i], caption: { ...items[i].caption, [lang]: value } };
            return { ...prev, [key]: items };
        });
    }, []);

    // ── Gallery helpers ──
    const addGalleryImage = (url: string) => {
        setField('gallery', [...(content.gallery || []), url]);
    };

    const removeGalleryImage = (i: number) => {
        setField('gallery', (content.gallery || []).filter((_, idx) => idx !== i));
    };

    // ── Process steps helpers ──
    const addProcessStep = () => {
        const step: ProcessStep = { title: {}, text: {} };
        setField('process_steps', [...(content.process_steps || []), step]);
    };

    const removeProcessStep = (i: number) => {
        setField('process_steps', (content.process_steps || []).filter((_, idx) => idx !== i));
    };

    const handleProcessStepChange = useCallback((i: number, field: 'title' | 'text', lang: 'en' | 'uk' | 'nl', value: string) => {
        setContent(prev => {
            const steps = [...(prev.process_steps || [])];
            steps[i] = { ...steps[i], [field]: { ...steps[i][field], [lang]: value } };
            return { ...prev, process_steps: steps };
        });
    }, []);

    // ── Auto-translate: collect all EN texts, send to API, fill empty UK/NL ──
    const handleAutoTranslate = async () => {
        // Collect all localized text fields with their EN values
        const localizedKeys: (keyof EventContent)[] = [
            'hero_title', 'hero_subtitle', 'hero_kicker', 'hero_button',
            'intro_kicker', 'intro_title', 'intro_text', 'intro_button', 'intro_text_col2',
            'full_service_title', 'full_service_text', 'full_service_included', 'full_service_included_label',
            'other_services_kicker',
            'service1_title', 'service1_text', 'service1_italic', 'service1_cta',
            'service2_title', 'service2_text', 'service2_italic', 'service2_cta',
            'final_choices_title', 'final_choices_text', 'final_choices_link',
            'quote_kicker', 'quote_text', 'quote_author',
            'portfolio_kicker', 'portfolio_title', 'portfolio_sidebar_text',
            'packages_kicker', 'packages_title',
            'decor_kicker', 'decor_title',
            'bloom_kicker', 'bloom_title', 'bloom_text', 'bloom_button',
            'cta_title', 'cta_text', 'cta_button',
            'form_title',
        ];

        const texts: { key: string; value: string }[] = [];

        for (const key of localizedKeys) {
            const lt = content[key] as LocalizedText | undefined;
            const en = lt?.en?.trim();
            if (en) {
                texts.push({ key: String(key), value: en });
            }
        }

        // Sections
        (content.sections || []).forEach((s, i) => {
            if (s.title?.en?.trim()) texts.push({ key: `section_${i}_title`, value: s.title.en });
            if (s.text?.en?.trim()) texts.push({ key: `section_${i}_text`, value: s.text.en });
        });

        // Process steps
        (content.process_steps || []).forEach((s, i) => {
            if (s.title?.en?.trim()) texts.push({ key: `process_${i}_title`, value: s.title.en });
            if (s.text?.en?.trim()) texts.push({ key: `process_${i}_text`, value: s.text.en });
        });

        // Portfolio / packages / decor captions
        (['portfolio', 'packages', 'decor'] as const).forEach(key => {
            (content[key] || []).forEach((item, i) => {
                if (item.caption?.en?.trim()) texts.push({ key: `${key}_${i}_caption`, value: item.caption.en });
            });
        });

        if (texts.length === 0) return;

        setTranslating(true);
        try {
            // The backend rejects > 10 texts per request, so split into chunks
            // of 10 and merge all responses into a single translations map.
            const CHUNK = 10;
            const translations: Record<string, Record<string, string>> = {};
            for (let i = 0; i < texts.length; i += CHUNK) {
                const slice = texts.slice(i, i + CHUNK);
                const res = await fetch('/api/admin/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ texts: slice }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                Object.assign(translations, data.translations);
            }

            setContent(prev => {
                const next = { ...prev };

                // Fill top-level localized fields
                for (const key of localizedKeys) {
                    const k = String(key);
                    if (translations[k]) {
                        const lt = { ...(next[key] as LocalizedText) };
                        if (!lt.uk?.trim() && translations[k].uk) lt.uk = translations[k].uk;
                        if (!lt.nl?.trim() && translations[k].nl) lt.nl = translations[k].nl;
                        (next as Record<string, unknown>)[key] = lt;
                    }
                }

                // Fill section translations
                const sections = [...(next.sections || [])];
                sections.forEach((s, i) => {
                    const tKey = `section_${i}_title`;
                    const txKey = `section_${i}_text`;
                    if (translations[tKey]) {
                        const t = { ...s.title };
                        if (!t.uk?.trim() && translations[tKey].uk) t.uk = translations[tKey].uk;
                        if (!t.nl?.trim() && translations[tKey].nl) t.nl = translations[tKey].nl;
                        sections[i] = { ...sections[i], title: t };
                    }
                    if (translations[txKey]) {
                        const t = { ...s.text };
                        if (!t.uk?.trim() && translations[txKey].uk) t.uk = translations[txKey].uk;
                        if (!t.nl?.trim() && translations[txKey].nl) t.nl = translations[txKey].nl;
                        sections[i] = { ...sections[i], text: t };
                    }
                });
                next.sections = sections;

                // Fill process steps translations
                const processSteps = [...(next.process_steps || [])];
                processSteps.forEach((s, i) => {
                    const tKey = `process_${i}_title`;
                    const txKey = `process_${i}_text`;
                    if (translations[tKey]) {
                        const t = { ...s.title };
                        if (!t.uk?.trim() && translations[tKey].uk) t.uk = translations[tKey].uk;
                        if (!t.nl?.trim() && translations[tKey].nl) t.nl = translations[tKey].nl;
                        processSteps[i] = { ...processSteps[i], title: t };
                    }
                    if (translations[txKey]) {
                        const t = { ...s.text };
                        if (!t.uk?.trim() && translations[txKey].uk) t.uk = translations[txKey].uk;
                        if (!t.nl?.trim() && translations[txKey].nl) t.nl = translations[txKey].nl;
                        processSteps[i] = { ...processSteps[i], text: t };
                    }
                });
                next.process_steps = processSteps;

                // Fill portfolio / packages / decor captions
                (['portfolio', 'packages', 'decor'] as const).forEach(key => {
                    const items = [...(next[key] || [])];
                    items.forEach((item, i) => {
                        const cKey = `${key}_${i}_caption`;
                        if (translations[cKey]) {
                            const c = { ...item.caption };
                            if (!c.uk?.trim() && translations[cKey].uk) c.uk = translations[cKey].uk;
                            if (!c.nl?.trim() && translations[cKey].nl) c.nl = translations[cKey].nl;
                            items[i] = { ...items[i], caption: c };
                        }
                    });
                    (next as Record<string, unknown>)[key] = items;
                });

                return next;
            });
        } catch (e) {
            console.error('Auto-translate error:', e);
        } finally {
            setTranslating(false);
        }
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

    const cardClass = "bg-white rounded-xl p-3 sm:p-6 shadow-lg";
    const isWedding = slug === 'weddings';

    return (
        <div className="space-y-6">
            {/* ── Auto-translate button ── */}
            <div className="flex justify-end">
                <button
                    onClick={handleAutoTranslate}
                    disabled={translating}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50 transition-colors text-sm"
                >
                    {translating ? <Loader2 className="animate-spin" size={16} /> : <Languages size={16} />}
                    {translating ? (at.btn_auto_translating || 'Translating…') : (at.btn_auto_translate || '🌐 Auto-translate')}
                </button>
            </div>

            {/* ── Homepage Slider ── */}
            <SectionHeader title="Homepage Slider" />
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-2">Слайдер на главной</h3>
                <p className="text-xs text-zinc-400 mb-4">Эти фотографии будут листаться автоматически каждые 5 секунд в разделе &quot;Свадьбы и вечеринки&quot; на главной странице.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {(content.slider_images || []).map((img, i) => (
                        <div key={`slider-${i}`} className="relative">
                            <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
                            <button
                                onClick={() => setField('slider_images', (content.slider_images || []).filter((_, idx) => idx !== i))}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    <GalleryUploader
                        uploadImage={uploadImage}
                        onUpload={(url) => setField('slider_images', [...(content.slider_images || []), url])}
                        label={at.events_add_portfolio || "Добавить фото"}
                    />
                </div>
            </div>

            {/* ── Hero Section ── */}
            <SectionHeader title="Hero Section" />
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-4">{at.events_hero}</h3>
                <div className="space-y-4">
                    <ImageUploadField url={content.hero_image || ''} onUpload={url => setField('hero_image', url)} label={at.events_hero_image} uploadImage={uploadImage} clickLabel={at.form_photo_click} sizeHint="1920×1080 px (16:9)" />
                    {isWedding && (
                        <LangInputs label={at.events_hero_kicker} value={getLocalized('hero_kicker')} onChange={(lang, val) => handleLocalizedChange('hero_kicker', lang, val)} at={at} />
                    )}
                    <LangInputs label={at.events_hero_title} value={getLocalized('hero_title')} onChange={(lang, val) => handleLocalizedChange('hero_title', lang, val)} at={at} />
                    <LangInputs label={at.events_hero_subtitle} value={getLocalized('hero_subtitle')} onChange={(lang, val) => handleLocalizedChange('hero_subtitle', lang, val)} at={at} />
                    {isWedding && (
                        <LangInputs label={at.events_hero_button} value={getLocalized('hero_button')} onChange={(lang, val) => handleLocalizedChange('hero_button', lang, val)} at={at} />
                    )}
                </div>
            </div>

            {/* ── Intro Section ── */}
            <SectionHeader title="Intro Section" />
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-4">{at.events_intro}</h3>
                <div className="space-y-4">
                    <LangInputs label={at.events_kicker} value={getLocalized('intro_kicker')} onChange={(lang, val) => handleLocalizedChange('intro_kicker', lang, val)} at={at} />
                    <LangInputs label={at.events_title_field} value={getLocalized('intro_title')} onChange={(lang, val) => handleLocalizedChange('intro_title', lang, val)} at={at} />
                    <LangInputs label={at.events_text_col1} value={getLocalized('intro_text')} onChange={(lang, val) => handleLocalizedChange('intro_text', lang, val)} at={at} multiline />
                    {isWedding && (
                        <LangInputs label={at.events_text_col2} value={getLocalized('intro_text_col2')} onChange={(lang, val) => handleLocalizedChange('intro_text_col2', lang, val)} at={at} multiline />
                    )}
                    <LangInputs label={at.events_button} value={getLocalized('intro_button')} onChange={(lang, val) => handleLocalizedChange('intro_button', lang, val)} at={at} />
                </div>
            </div>

            {/* ── Media Section (Events only) ── */}
            {!isWedding && (<>
                <SectionHeader title="Media Section" />
                <div className={cardClass}>
                    <h3 className="text-lg font-bold mb-4">{at.events_media}</h3>
                    <ImageUploadField url={content.media_image || ''} onUpload={url => setField('media_image', url)} label={at.events_media_image} uploadImage={uploadImage} clickLabel={at.form_photo_click} sizeHint="1920×1080 px (16:9)" />
                </div>
            </>)}

            {/* ── Full Service (Weddings only) ── */}
            {isWedding && (<>
                <SectionHeader title="Full Service Section" />
                <div className={cardClass}>
                    <h3 className="text-lg font-bold mb-4">{at.events_full_service_h}</h3>
                    <div className="space-y-4">
                        <ImageUploadField url={content.full_service_image || ''} onUpload={url => setField('full_service_image', url)} label={at.events_full_service_image} uploadImage={uploadImage} clickLabel={at.form_photo_click} sizeHint="800×1067 px (3:4)" />
                        <LangInputs label={at.events_title_field} value={getLocalized('full_service_title')} onChange={(lang, val) => handleLocalizedChange('full_service_title', lang, val)} at={at} />
                        <LangInputs label={at.events_text} value={getLocalized('full_service_text')} onChange={(lang, val) => handleLocalizedChange('full_service_text', lang, val)} at={at} multiline />
                        <LangInputs label={at.events_included_label_field} value={getLocalized('full_service_included_label')} onChange={(lang, val) => handleLocalizedChange('full_service_included_label', lang, val)} at={at} />
                        <LangInputs label={at.events_included_items} value={getLocalized('full_service_included')} onChange={(lang, val) => handleLocalizedChange('full_service_included', lang, val)} at={at} multiline />
                    </div>
                </div>
            </>)}

            {/* ── Other Services (Weddings only) ── */}
            {isWedding && (<>
                <SectionHeader title="Other Services Section" />
                <div className={cardClass}>
                    <h3 className="text-lg font-bold mb-4">{at.events_other_services_h}</h3>
                    <div className="space-y-4">
                        <LangInputs label={at.events_section_kicker} value={getLocalized('other_services_kicker')} onChange={(lang, val) => handleLocalizedChange('other_services_kicker', lang, val)} at={at} />
                        <ImageUploadField url={content.other_services_image || ''} onUpload={url => setField('other_services_image', url)} label={at.events_other_services_image} uploadImage={uploadImage} clickLabel={at.form_photo_click} sizeHint="800×1200 px" />
                        <p className="text-xs font-bold text-zinc-500 pt-2">{at.events_service1_label}</p>
                        <LangInputs label={at.events_service1_title} value={getLocalized('service1_title')} onChange={(lang, val) => handleLocalizedChange('service1_title', lang, val)} at={at} />
                        <LangInputs label={at.events_service1_text} value={getLocalized('service1_text')} onChange={(lang, val) => handleLocalizedChange('service1_text', lang, val)} at={at} multiline />
                        <LangInputs label={at.events_service1_italic} value={getLocalized('service1_italic')} onChange={(lang, val) => handleLocalizedChange('service1_italic', lang, val)} at={at} />
                        <LangInputs label={at.events_service1_button} value={getLocalized('service1_cta')} onChange={(lang, val) => handleLocalizedChange('service1_cta', lang, val)} at={at} />
                        <p className="text-xs font-bold text-zinc-500 pt-2">{at.events_service2_label}</p>
                        <LangInputs label={at.events_service2_title} value={getLocalized('service2_title')} onChange={(lang, val) => handleLocalizedChange('service2_title', lang, val)} at={at} />
                        <LangInputs label={at.events_service2_text} value={getLocalized('service2_text')} onChange={(lang, val) => handleLocalizedChange('service2_text', lang, val)} at={at} multiline />
                        <LangInputs label={at.events_service2_italic} value={getLocalized('service2_italic')} onChange={(lang, val) => handleLocalizedChange('service2_italic', lang, val)} at={at} />
                        <LangInputs label={at.events_service2_button} value={getLocalized('service2_cta')} onChange={(lang, val) => handleLocalizedChange('service2_cta', lang, val)} at={at} />
                    </div>
                </div>
            </>)}

            {/* ── Final Choices (Weddings only) ── */}
            {isWedding && (<>
                <SectionHeader title="Final Choices Section" />
                <div className={cardClass}>
                    <h3 className="text-lg font-bold mb-4">{at.events_final_choices_h}</h3>
                    <div className="space-y-4">
                        <LangInputs label={at.events_title_field} value={getLocalized('final_choices_title')} onChange={(lang, val) => handleLocalizedChange('final_choices_title', lang, val)} at={at} />
                        <LangInputs label={at.events_text} value={getLocalized('final_choices_text')} onChange={(lang, val) => handleLocalizedChange('final_choices_text', lang, val)} at={at} multiline />
                        <LangInputs label={at.events_underline_link} value={getLocalized('final_choices_link')} onChange={(lang, val) => handleLocalizedChange('final_choices_link', lang, val)} at={at} />
                    </div>
                </div>
            </>)}

            {/* ── Quote / Love Letters (Weddings only) ── */}
            {isWedding && (<>
                <SectionHeader title="Quote / Love Letters" />
                <div className={cardClass}>
                    <h3 className="text-lg font-bold mb-4">{at.events_quote}</h3>
                    <div className="space-y-4">
                        <ImageUploadField url={content.quote_image || ''} onUpload={url => setField('quote_image', url)} label={at.events_quote_image} uploadImage={uploadImage} clickLabel={at.form_photo_click} sizeHint="1920×1080 px (16:9)" />
                        <LangInputs label={at.events_quote_kicker} value={getLocalized('quote_kicker')} onChange={(lang, val) => handleLocalizedChange('quote_kicker', lang, val)} at={at} />
                        <LangInputs label={at.events_quote_text} value={getLocalized('quote_text')} onChange={(lang, val) => handleLocalizedChange('quote_text', lang, val)} at={at} multiline />
                        <LangInputs label={at.events_quote_author} value={getLocalized('quote_author')} onChange={(lang, val) => handleLocalizedChange('quote_author', lang, val)} at={at} />
                    </div>
                </div>
            </>)}

            {/* ── Framed Sections (Events only) ── */}
            {!isWedding && (<>
                <SectionHeader title="Framed Sections" />
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">{at.events_sections}</h3>
                        <button onClick={addSection} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                            <Plus size={16} /> {at.events_add_section}
                        </button>
                    </div>
                    <div className="space-y-6">
                        {(content.sections || []).map((section, i) => (
                            <div key={`section-${i}`} className="border border-zinc-200 rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-500">#{i + 1}</span>
                                    <button onClick={() => removeSection(i)} className="text-red-500 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <ImageUploadField url={section.image} onUpload={url => updateSectionImage(i, url)} label={at.events_section_image} uploadImage={uploadImage} clickLabel={at.form_photo_click} sizeHint="800×1067 px (3:4)" />
                                <LangInputs label={at.events_title_field} value={section.title || {}} onChange={(lang, val) => handleSectionLocalizedChange(i, 'title', lang, val)} at={at} />
                                <LangInputs label={at.events_text} value={section.text || {}} onChange={(lang, val) => handleSectionLocalizedChange(i, 'text', lang, val)} at={at} multiline />
                            </div>
                        ))}
                    </div>
                </div>
            </>)}



            {/* ── Process Steps Section ── */}
            <SectionHeader title="Process Steps" />
            <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">🔢 {at.events_process}</h3>
                    <button onClick={addProcessStep} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                        <Plus size={16} /> {at.events_add_step}
                    </button>
                </div>
                <div className="space-y-4">
                    {(content.process_steps || []).map((step, i) => (
                        <div key={`process-${i}`} className="border border-zinc-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-display font-light text-zinc-400">{['I', 'II', 'III', 'IV', 'V', 'VI'][i] || `#${i + 1}`}</span>
                                <button onClick={() => removeProcessStep(i)} className="text-red-500 hover:text-red-600">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <LangInputs
                                label={at.events_step_title}
                                value={step.title || {}}
                                onChange={(lang, val) => handleProcessStepChange(i, 'title', lang, val)}
                                at={at}
                            />
                            <LangInputs
                                label={at.events_step_text}
                                value={step.text || {}}
                                onChange={(lang, val) => handleProcessStepChange(i, 'text', lang, val)}
                                at={at}
                                multiline
                            />
                        </div>
                    ))}
                    {(content.process_steps || []).length === 0 && (
                        <p className="text-sm text-zinc-400 text-center py-4">{at.events_process_empty}</p>
                    )}
                </div>
            </div>

            {/* ── Portfolio Section ── */}
            <SectionHeader title="Portfolio Section" />
            {isWedding && (
                <div className={cardClass}>
                    <div className="mb-4">
                        <LangInputs label={at.events_portfolio_sidebar} value={getLocalized('portfolio_sidebar_text')} onChange={(lang, val) => handleLocalizedChange('portfolio_sidebar_text', lang, val)} at={at} multiline />
                    </div>
                </div>
            )}
            <ItemsSection
                content={content}
                itemKey="portfolio"
                titleLabel={at.events_portfolio}
                kickerKey="portfolio_kicker"
                titleKey="portfolio_title"
                kickerLabel={at.events_portfolio_kicker}
                titleFieldLabel={at.events_portfolio_title}
                addLabel={at.events_add_portfolio}
                imageLabel={at.events_portfolio_image}
                captionLabel={at.events_portfolio_caption}
                imageSizeHint="600×800 px (3:4)"
                at={at}
                cardClass={cardClass}
                uploadImage={uploadImage}
                getLocalized={getLocalized}
                onLocalizedChange={handleLocalizedChange}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onItemImageChange={handleItemImageChange}
                onItemLocalizedChange={handleItemLocalizedChange}
            />

            {/* ── Bloom With Us (Weddings only) ── */}
            {isWedding && (<>
                <SectionHeader title="Bloom With Us Section" />
                <div className={cardClass}>
                    <h3 className="text-lg font-bold mb-4">{at.events_bloom_h}</h3>
                    <div className="space-y-4">
                        <ImageUploadField url={content.bloom_image || ''} onUpload={url => setField('bloom_image', url)} label={at.events_bloom_image} uploadImage={uploadImage} clickLabel={at.form_photo_click} sizeHint="600×700 px (4:5)" />
                        <LangInputs label={at.events_kicker} value={getLocalized('bloom_kicker')} onChange={(lang, val) => handleLocalizedChange('bloom_kicker', lang, val)} at={at} />
                        <LangInputs label={at.events_title_field} value={getLocalized('bloom_title')} onChange={(lang, val) => handleLocalizedChange('bloom_title', lang, val)} at={at} />
                        <LangInputs label={at.events_text} value={getLocalized('bloom_text')} onChange={(lang, val) => handleLocalizedChange('bloom_text', lang, val)} at={at} multiline />
                        <LangInputs label={at.events_button} value={getLocalized('bloom_button')} onChange={(lang, val) => handleLocalizedChange('bloom_button', lang, val)} at={at} />
                    </div>
                </div>
            </>)}

            {/* ── CTA Banner (Weddings only) ── */}
            {isWedding && (<>
                <SectionHeader title="CTA Banner Section" />
                <div className={cardClass}>
                    <h3 className="text-lg font-bold mb-4">{at.events_cta_h}</h3>
                    <div className="space-y-4">
                        <LangInputs label={at.events_title_field} value={getLocalized('cta_title')} onChange={(lang, val) => handleLocalizedChange('cta_title', lang, val)} at={at} />
                        <LangInputs label={at.events_text} value={getLocalized('cta_text')} onChange={(lang, val) => handleLocalizedChange('cta_text', lang, val)} at={at} multiline />
                        <LangInputs label={at.events_button} value={getLocalized('cta_button')} onChange={(lang, val) => handleLocalizedChange('cta_button', lang, val)} at={at} />
                    </div>
                </div>
            </>)}

            {/* ── Packages Section (Events only) ── */}
            {!isWedding && (<>
                <SectionHeader title="Packages Section" />
                <ItemsSection
                    content={content}
                    itemKey="packages"
                    titleLabel={at.events_packages}
                    kickerKey="packages_kicker"
                    titleKey="packages_title"
                    kickerLabel={at.events_packages_kicker}
                    titleFieldLabel={at.events_packages_title}
                    addLabel={at.events_add_package}
                    imageLabel={at.events_packages_image}
                    captionLabel={at.events_packages_caption}
                    imageSizeHint="600×800 px (3:4)"
                    at={at}
                    cardClass={cardClass}
                    uploadImage={uploadImage}
                    getLocalized={getLocalized}
                    onLocalizedChange={handleLocalizedChange}
                    onAddItem={addItem}
                    onRemoveItem={removeItem}
                    onItemImageChange={handleItemImageChange}
                    onItemLocalizedChange={handleItemLocalizedChange}
                />
            </>)}

            {/* ── Decor Section (Events only) ── */}
            {!isWedding && (<>
                <SectionHeader title="Decor Section" />
                <ItemsSection
                    content={content}
                    itemKey="decor"
                    titleLabel={at.events_decor}
                    kickerKey="decor_kicker"
                    titleKey="decor_title"
                    kickerLabel={at.events_decor_kicker}
                    titleFieldLabel={at.events_decor_title}
                    addLabel={at.events_add_decor}
                    imageLabel={at.events_decor_image}
                    captionLabel={at.events_decor_caption}
                    imageSizeHint="600×800 px (3:4)"
                    at={at}
                    cardClass={cardClass}
                    uploadImage={uploadImage}
                    getLocalized={getLocalized}
                    onLocalizedChange={handleLocalizedChange}
                    onAddItem={addItem}
                    onRemoveItem={removeItem}
                    onItemImageChange={handleItemImageChange}
                    onItemLocalizedChange={handleItemLocalizedChange}
                />
            </>)}

            {/* ── Gallery Section ── */}
            <SectionHeader title="Gallery Section (Instagram strip)" />
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-2">{at.events_gallery}</h3>
                <p className="text-xs text-zinc-400 mb-4">📐 800×800 px (1:1, square)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {(content.gallery || []).map((img, i) => (
                        <div key={`gallery-${i}`} className="relative">
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

            {/* ── Form Section ── */}
            <SectionHeader title="Inquiry Form" />
            <div className={cardClass}>
                <h3 className="text-lg font-bold mb-4">{at.events_form}</h3>
                <LangInputs label={at.events_form_title} value={getLocalized('form_title')} onChange={(lang, val) => handleLocalizedChange('form_title', lang, val)} at={at} />
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={handleAutoTranslate}
                    disabled={translating}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                >
                    {translating ? <Loader2 className="animate-spin" size={20} /> : <Languages size={20} />}
                    {translating ? (at.btn_auto_translating || 'Translating…') : (at.btn_auto_translate || '🌐 Auto-translate')}
                </button>
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

/* ================================================================
 *  ItemsSection — portfolio / packages / decor editor
 *  Defined OUTSIDE EventEditor to prevent re-creation on render.
 * ================================================================ */
function ItemsSection({
    content,
    itemKey,
    titleLabel,
    kickerKey,
    titleKey,
    kickerLabel,
    titleFieldLabel,
    addLabel,
    imageLabel,
    captionLabel,
    imageSizeHint,
    at,
    cardClass,
    uploadImage,
    getLocalized,
    onLocalizedChange,
    onAddItem,
    onRemoveItem,
    onItemImageChange,
    onItemLocalizedChange,
}: {
    content: EventContent;
    itemKey: 'portfolio' | 'packages' | 'decor';
    titleLabel: string;
    kickerKey: keyof EventContent;
    titleKey: keyof EventContent;
    kickerLabel: string;
    titleFieldLabel: string;
    addLabel: string;
    imageLabel: string;
    captionLabel: string;
    imageSizeHint?: string;
    at: Record<string, string>;
    cardClass: string;
    uploadImage: (file: File) => Promise<string>;
    getLocalized: (key: keyof EventContent) => LocalizedText;
    onLocalizedChange: (key: keyof EventContent, lang: 'en' | 'uk' | 'nl', val: string) => void;
    onAddItem: (key: 'portfolio' | 'packages' | 'decor') => void;
    onRemoveItem: (key: 'portfolio' | 'packages' | 'decor', i: number) => void;
    onItemImageChange: (key: 'portfolio' | 'packages' | 'decor', i: number, url: string) => void;
    onItemLocalizedChange: (key: 'portfolio' | 'packages' | 'decor', i: number, lang: 'en' | 'uk' | 'nl', val: string) => void;
}) {
    return (
        <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{titleLabel}</h3>
                <button onClick={() => onAddItem(itemKey)} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                    <Plus size={16} /> {addLabel}
                </button>
            </div>
            <div className="space-y-3 mb-4">
                <LangInputs label={kickerLabel} value={getLocalized(kickerKey)} onChange={(lang, val) => onLocalizedChange(kickerKey, lang, val)} at={at} />
                <LangInputs label={titleFieldLabel} value={getLocalized(titleKey)} onChange={(lang, val) => onLocalizedChange(titleKey, lang, val)} at={at} />
            </div>
            <div className="space-y-6">
                {(content[itemKey] || []).map((item, i) => (
                    <div key={`${itemKey}-${i}`} className="border border-zinc-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-500">#{i + 1}</span>
                            <button onClick={() => onRemoveItem(itemKey, i)} className="text-red-500 hover:text-red-600">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <ImageUploadField url={item.image} onUpload={url => onItemImageChange(itemKey, i, url)} label={imageLabel} uploadImage={uploadImage} clickLabel={at.form_photo_click} sizeHint={imageSizeHint} />
                        <LangInputs
                            label={captionLabel}
                            value={item.caption || {}}
                            onChange={(lang, val) => onItemLocalizedChange(itemKey, i, lang, val)}
                            at={at}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
