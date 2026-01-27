'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, DollarSign, Clock, Package, AlignLeft, Tag, ImagePlus, X, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Category {
    id: number;
    name: string;
}

export default function CreateProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '0', // Legacy, will be calculated
        categoryId: '',
        warrantyHours: '24',
        variant: '', // Legacy
        imageUrl: '',
        variants: [{ name: '', price: '' }] as { name: string, price: string }[]
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch Categories
    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                if (data.success) setCategories(data.data);
            })
            .catch(err => toast.error('Lỗi tải danh mục'));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle Image Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh quá lớn. Tối đa 5MB');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // Upload
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, imageUrl: data.url }));
                toast.success('Upload ảnh thành công!');
            } else {
                toast.error(data.error || 'Lỗi upload ảnh');
                setImagePreview(null);
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
            setImagePreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setFormData(prev => ({ ...prev, imageUrl: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Variants
        if (formData.variants.length === 0) {
            toast.error('Vui lòng thêm ít nhất 1 loại sản phẩm');
            return;
        }

        const validVariants = formData.variants.filter(v => v.name && v.price);
        if (validVariants.length === 0) {
            toast.error('Vui lòng nhập đầy đủ thông tin loại sản phẩm');
            return;
        }

        setIsLoading(true);

        try {
            const body = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(validVariants[0].price), // Default base price for parsing logic on server
                categoryId: parseInt(formData.categoryId),
                warrantyHours: parseInt(formData.warrantyHours),
                imageUrl: formData.imageUrl || undefined,
                variants: validVariants.map(v => ({
                    name: v.name,
                    price: parseFloat(v.price)
                }))
            };

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await res.json();
            if (result.success) {
                toast.success('Tạo sản phẩm thành công!');
                router.push('/dashboard/products');
            } else {
                toast.error(result.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/products" className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Thêm sản phẩm mới</h1>
                    <p className="text-slate-400">Tạo sản phẩm để bắt đầu kinh doanh.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-6">

                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Package size={20} className="text-blue-400" />
                        Thông tin cơ bản
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Tên sản phẩm <span className="text-red-500">*</span></label>
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ví dụ: Netflix Premium 1 Tháng"
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Danh mục <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <select
                                    required
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white appearance-none focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="">Chọn danh mục...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Mô tả sản phẩm <span className="text-red-500">*</span></label>
                        <textarea
                            required
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Mô tả chi tiết về sản phẩm, chế độ bảo hành..."
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Ảnh sản phẩm</label>
                        <div className="relative">
                            {imagePreview ? (
                                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-600">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-400 rounded-full text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-white" size={32} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-slate-700/30 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <ImagePlus className="text-slate-400 mb-3" size={40} />
                                        <p className="text-sm text-slate-400">
                                            <span className="font-semibold text-blue-400">Click để upload</span> hoặc kéo thả ảnh
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF, WEBP (Max 5MB)</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-700/50" />

                {/* Pricing & Warranty */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <DollarSign size={20} className="text-green-400" />
                        Giá bán & Biến thể
                    </h3>

                    <div className="space-y-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-300">Các loại sản phẩm (Biến thể)</label>
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData(prev => {
                                        const currentVariants = (prev as any).variants || [];
                                        return {
                                            ...prev,
                                            variants: [...currentVariants, { name: '', price: '' }]
                                        };
                                    });
                                }}
                                className="text-xs flex items-center gap-1 bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30 transition-colors"
                            >
                                <Plus size={14} /> Thêm loại
                            </button>
                        </div>

                        {(!((formData as any).variants) || (formData as any).variants.length === 0) && (
                            <div className="text-center p-4 border border-dashed border-slate-700 rounded text-slate-500 text-sm">
                                Chưa có biến thể. Thêm ít nhất 1 loại.
                            </div>
                        )}

                        {((formData as any).variants || []).map((variant: any, index: number) => (
                            <div key={index} className="flex gap-3 items-start">
                                <div className="flex-1 space-y-1">
                                    <input
                                        placeholder="Tên loại (VD: 1 Tháng)"
                                        value={variant.name}
                                        onChange={(e) => {
                                            const newVariants = [...((formData as any).variants || [])];
                                            newVariants[index].name = e.target.value;
                                            setFormData(prev => ({ ...prev, variants: newVariants }));
                                        }}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="w-40 space-y-1 relative">
                                    <span className="absolute left-3 top-2 text-slate-500 text-xs font-bold">₫</span>
                                    <input
                                        type="number"
                                        placeholder="Giá"
                                        value={variant.price}
                                        onChange={(e) => {
                                            const newVariants = [...((formData as any).variants || [])];
                                            newVariants[index].price = e.target.value;
                                            setFormData(prev => ({ ...prev, variants: newVariants }));
                                        }}
                                        className="w-full pl-6 pr-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white focus:border-blue-500 outline-none"
                                        required
                                        min="1000"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newVariants = ((formData as any).variants || []).filter((_: any, i: number) => i !== index);
                                        setFormData(prev => ({ ...prev, variants: newVariants }));
                                    }}
                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Hidden Price field for fallback logic if needed, but we rely on variants now */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Bảo hành (Giờ)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    name="warrantyHours"
                                    value={formData.warrantyHours}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Tạo sản phẩm
                    </button>
                </div>
            </form>
        </div>
    );
}
