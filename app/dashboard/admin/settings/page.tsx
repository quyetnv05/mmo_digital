'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Settings, DollarSign, LifeBuoy, Monitor, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SystemSetting {
    key: string;
    value: string;
    group: 'GENERAL' | 'FINANCE' | 'SUPPORT';
    description: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    isPublic: boolean;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'FINANCE' | 'SUPPORT'>('GENERAL');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { register, handleSubmit, setValue } = useForm();

    // Load initial settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.status === 403) {
                    setMessage({ type: 'error', text: 'Bạn không có quyền truy cập trang này' });
                    setIsLoading(false);
                    return;
                }
                const data = await res.json();
                if (data.success) {
                    setSettings(data.data);
                    // Set initial form values
                    data.data.forEach((s: SystemSetting) => {
                        setValue(s.key, s.value);
                    });
                }
            } catch (error) {
                console.error('Failed to load settings', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [setValue]);

    const onSubmit = async (data: any) => {
        setIsSaving(true);
        setMessage(null);

        try {
            // Find changed settings and update them one by one (or could be bulk API)
            const currentTabSettings = settings.filter(s => s.group === activeTab);

            const promises = currentTabSettings.map(async (setting) => {
                let newValue = data[setting.key];

                // Handle boolean conversion from string "true"/"false" or checkbox
                if (setting.type === 'boolean') {
                    // If it's a checkbox, data[key] might be true/false boolean directly
                    // But we store as string in DB for now based on schema? 
                    // Wait, schema says value is String. So we must convert boolean to string.
                    newValue = String(newValue);
                }

                if (newValue !== setting.value) {
                    const res = await fetch('/api/admin/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: setting.key, value: newValue })
                    });
                    return res.json();
                }
                return Promise.resolve({ success: true });
            });

            await Promise.all(promises);

            // Update local state and refetch purely to be safe or just update local
            setSettings(prev => prev.map(s => ({
                ...s,
                value: data[s.key] !== undefined ? String(data[s.key]) : s.value
            })));

            setMessage({ type: 'success', text: 'Đã lưu cấu hình thành công' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Lưu thất bại, vui lòng thử lại' });
        } finally {
            setIsSaving(false);
        }
    };

    const getFilteredSettings = () => settings.filter(s => s.group === activeTab);

    if (isLoading) return <div className="p-8 text-white flex items-center gap-2"><Loader2 className="animate-spin" /> Đang tải cấu hình...</div>;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Settings className="text-slate-400" />
                    Cấu hình Hệ thống
                </h1>
                <p className="text-slate-400 mt-1">
                    Quản lý các thông số vận hành của nền tảng.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700/50">
                <button
                    onClick={() => setActiveTab('GENERAL')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'GENERAL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Monitor size={16} /> Cài đặt chung
                </button>
                <button
                    onClick={() => setActiveTab('FINANCE')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'FINANCE' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <DollarSign size={16} /> Tài chính
                </button>
                <button
                    onClick={() => setActiveTab('SUPPORT')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'SUPPORT' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <LifeBuoy size={16} /> Hỗ trợ
                </button>
            </div>

            {/* Form Area */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span className="font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        {getFilteredSettings().map((setting) => (
                            <div key={setting.key}>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                                    {setting.description}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded">{setting.key}</span>
                                        {setting.isPublic && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">PUBLIC</span>}
                                    </div>
                                </label>

                                {setting.type === 'boolean' ? (
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                {...register(setting.key)}
                                                defaultChecked={setting.value === 'true'}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-slate-400">
                                                {/* Could show dynamic text like "Enabled" or "Disabled" based on watch? For now static */}
                                            </span>
                                        </label>
                                    </div>
                                ) : (
                                    <input
                                        {...register(setting.key)}
                                        type={setting.type === 'number' ? 'number' : 'text'}
                                        step={setting.type === 'number' ? 'any' : undefined}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                                    />
                                )}

                                <p className="text-xs text-slate-500 mt-1 flex justify-between">
                                    <span>Giá trị hiện tại: {setting.value}</span>
                                    <span className="opacity-50 uppercase">{setting.type}</span>
                                </p>
                            </div>
                        ))}

                        {getFilteredSettings().length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                Chưa có cấu hình nào cho mục này.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-700/50 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving || getFilteredSettings().length === 0}
                            className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
