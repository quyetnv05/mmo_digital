'use client';

import { useState } from 'react';

interface ProductTabsProps {
    description: string;
    reviewsContent: React.ReactNode;
}

export default function ProductTabs({ description, reviewsContent }: ProductTabsProps) {
    const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'api'>('description');

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden mt-8">
            {/* Tab Headers */}
            <div className="flex border-b border-slate-700 bg-slate-900">
                <button
                    onClick={() => setActiveTab('description')}
                    className={`flex-1 py-4 text-sm font-semibold text-center transition-colors relative
                        ${activeTab === 'description' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Mô tả
                    {activeTab === 'description' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 py-4 text-sm font-semibold text-center transition-colors relative
                        ${activeTab === 'reviews' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Đánh giá
                    {activeTab === 'reviews' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('api')}
                    className={`flex-1 py-4 text-sm font-semibold text-center transition-colors relative
                        ${activeTab === 'api' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    API
                    {activeTab === 'api' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 text-slate-300 min-h-[200px]">
                {activeTab === 'description' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white uppercase mb-4">Mô Tả Sản Phẩm</h3>
                        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-line leading-relaxed">
                            {description}
                        </div>
                    </div>
                )}
                {activeTab === 'reviews' && (
                    <div>
                        {reviewsContent}
                    </div>
                )}
                {activeTab === 'api' && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                        <p>Tài liệu API tích hợp tự động cho sản phẩm này.</p>
                        <code className="mt-4 p-2 bg-slate-950 border border-slate-800 rounded font-mono text-xs">
                            POST /api/orders/create {'{ productId: ..., quantity: ... }'}
                        </code>
                    </div>
                )}
            </div>
        </div>
    );
}
