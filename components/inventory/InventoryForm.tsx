'use client';

import { useState } from 'react';
import { Upload, Package, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Product {
    id: number;
    name: string;
    stock: number;
}

interface InventoryFormProps {
    products: Product[];
}

export default function InventoryForm({ products }: InventoryFormProps) {
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [content, setContent] = useState('');
    const [metadata, setMetadata] = useState({
        proxy: '',
        deviceInfo: '',
        source: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        data?: { added: number; duplicates: number };
    } | null>(null);

    const handleUpload = async () => {
        if (!selectedProduct || !content.trim()) {
            setResult({
                success: false,
                message: 'Vui lòng chọn sản phẩm và nhập dữ liệu',
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/inventory/bulk-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct,
                    content,
                    metadata: Object.fromEntries(
                        Object.entries(metadata).filter(([_, v]) => v.trim() !== '')
                    ),
                }),
            });

            const data = await response.json();
            setResult(data);

            if (data.success) {
                setContent('');
                // Maybe refresh page to show new stats?
            }
        } catch (error) {
            setResult({
                success: false,
                message: 'Lỗi kết nối. Vui lòng thử lại.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const lineCount = content.split('\n').filter((l) => l.trim()).length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Form */}
            <div className="lg:col-span-2 space-y-4">
                {/* Product Selection */}
                <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Chọn sản phẩm
                    </label>
                    <select
                        value={selectedProduct || ''}
                        onChange={(e) => setSelectedProduct(Number(e.target.value) || null)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
            text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            transition-all duration-200"
                    >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name} ({product.stock} trong kho)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Content Textarea */}
                <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-300">
                            Dữ liệu tài khoản
                        </label>
                        <span className="text-sm text-slate-500">
                            {lineCount} dòng
                        </span>
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Dán dữ liệu vào đây, mỗi tài khoản một dòng.&#10;Ví dụ:&#10;username1|password1|cookie1&#10;username2|password2|cookie2&#10;..."
                        rows={12}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
            text-white placeholder-slate-500 font-mono text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            transition-all duration-200 resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Định dạng: <code className="text-blue-400">user|pass|cookie</code> hoặc bất kỳ định dạng nào.
                        Hệ thống sẽ tự động tạo hash SHA-256 để chống trùng.
                    </p>
                </div>

                {/* Metadata (Optional) */}
                <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                        Thông tin bổ sung (tùy chọn)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Proxy</label>
                            <input
                                type="text"
                                value={metadata.proxy}
                                onChange={(e) => setMetadata({ ...metadata, proxy: e.target.value })}
                                placeholder="1.2.3.4:8080"
                                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Device</label>
                            <input
                                type="text"
                                value={metadata.deviceInfo}
                                onChange={(e) => setMetadata({ ...metadata, deviceInfo: e.target.value })}
                                placeholder="iPhone 13"
                                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Nguồn</label>
                            <input
                                type="text"
                                value={metadata.source}
                                onChange={(e) => setMetadata({ ...metadata, source: e.target.value })}
                                placeholder="Reg thủ công"
                                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg
                text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleUpload}
                    disabled={isLoading || !selectedProduct || !content.trim()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600
          hover:from-blue-500 hover:to-purple-500
          disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed
          text-white font-semibold rounded-lg shadow-lg
          flex items-center justify-center gap-2
          transition-all duration-200"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            <Upload size={20} />
                            Upload {lineCount > 0 ? `${lineCount} tài khoản` : ''}
                        </>
                    )}
                </button>

                {/* Result Message */}
                {result && (
                    <div
                        className={`p-4 rounded-lg border flex items-start gap-3 ${result.success
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}
                    >
                        {result.success ? (
                            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className="font-medium">{result.message}</p>
                            {result.data && (
                                <p className="text-sm mt-1 opacity-80">
                                    Đã thêm: {result.data.added} | Trùng: {result.data.duplicates}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-4">
                {/* Quick Stats */}
                <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Package className="text-blue-400" size={20} />
                        Thống kê kho
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Tổng sản phẩm</span>
                            <span className="text-white font-semibold">{products.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Tổng tồn kho</span>
                            <span className="text-green-400 font-semibold">
                                {products.reduce((sum, p) => sum + p.stock, 0)}
                            </span>
                        </div>
                        <hr className="border-slate-700" />
                        {products.map((product) => (
                            <div key={product.id} className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 truncate" title={product.name}>
                                    {product.name}
                                </span>
                                <span className="text-white font-medium ml-2">
                                    {product.stock}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tips */}
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
                    <h4 className="text-blue-400 font-medium mb-2">💡 Mẹo</h4>
                    <ul className="text-sm text-blue-300/80 space-y-1">
                        <li>• Mỗi dòng là một tài khoản</li>
                        <li>• Hệ thống tự động loại bỏ trùng</li>
                        <li>• Metadata giúp đối soát khi có khiếu nại</li>
                        <li>• Dữ liệu được mã hóa SHA-256</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
