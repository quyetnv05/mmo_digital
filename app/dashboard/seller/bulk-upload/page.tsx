'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function BulkUploadPage() {
    const [rawText, setRawText] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [products, setProducts] = useState<{ id: number, name: string }[]>([]);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<{ added: number; duplicates: number; errors: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch products
    useState(() => {
        fetch('/api/seller/products')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProducts(data.data);
                    if (data.data.length > 0) setSelectedProductId(String(data.data[0].id));
                }
            });
    });

    const handleUpload = async () => {
        if (!rawText.trim() || !selectedProductId) return;

        setStatus('processing');
        setErrorMessage('');
        setResult(null);

        try {
            const res = await fetch('/api/products/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rawText,
                    productId: selectedProductId
                }),
            });

            const data = await res.json();

            if (data.success) {
                setStatus('success');
                setResult(data.data);
                if (data.data.added > 0) {
                    setRawText('');
                }
            } else {
                setStatus('error');
                setErrorMessage(data.error || 'Upload failed');
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage('An unexpected error occurred');
        }
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Upload className="text-blue-400" />
                    Bulk Upload Product Items
                </h1>
                <p className="text-slate-400 mt-1">
                    Select a product and paste your list below.
                </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">

                {/* Product Selector */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Select Product</label>
                    <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                    >
                        <option value="">-- Choose Product --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                        ))}
                    </select>
                </div>

                {/* Text Area */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Product Content <span className="text-slate-500 font-normal">(one item per line)</span>
                    </label>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="user|pass|email|mailpass | 5000 | Random acc&#10;key123 | 10000"
                        className="w-full h-64 bg-slate-900 border border-slate-700 rounded-lg p-4 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none resize-y"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-slate-400 text-sm">
                        {rawText ? `${rawText.split('\n').filter(l => l.trim()).length} lines detected` : 'Waiting for input...'}
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={status === 'processing' || !rawText.trim() || !selectedProductId}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {status === 'processing' ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                        {status === 'processing' ? 'Processing...' : 'Upload Items'}
                    </button>
                </div>
            </div>

            {status === 'success' && result && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="text-green-400 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-green-400">Upload Complete</h3>
                        <ul className="text-sm text-green-300 mt-1 space-y-1">
                            <li>✅ Added: {result.added} items</li>
                            <li>⚠️ Duplicates (Skipped): {result.duplicates} items</li>
                            <li>❌ Errors/Invalid: {result.errors} lines</li>
                        </ul>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-400" />
                    <span className="text-red-300 font-medium">{errorMessage}</span>
                </div>
            )}
        </div>
    );
}
