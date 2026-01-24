'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Search, ShoppingBag, Clock } from 'lucide-react';
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ConversationList() {
    const pathname = usePathname();
    const { data, isLoading } = useSWR('/api/conversations', fetcher);
    const [searchTerm, setSearchTerm] = useState('');

    const conversations = data?.data || [];

    const filteredConversations = conversations.filter((conv: any) =>
        conv.partner.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
                <h1 className="text-xl font-bold text-white mb-4">Tin nhắn</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                {isLoading ? (
                    <div className="text-center py-4 text-slate-500 text-sm">Đang tải...</div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        Không tìm thấy hội thoại.
                    </div>
                ) : (
                    filteredConversations.map((conv: any) => {
                        const isActive = pathname === `/dashboard/messages/${conv.id}`;
                        return (
                            <Link
                                key={conv.id}
                                href={`/dashboard/messages/${conv.id}`}
                                className={`block p-3 rounded-xl transition-colors ${isActive
                                        ? 'bg-blue-600/10 border border-blue-500/20'
                                        : 'hover:bg-slate-800 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {conv.partner.username[0].toUpperCase()}
                                        </div>
                                        {/* Online Indicator Status - Mocked for now */}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className={`font-medium text-sm truncate ${isActive ? 'text-blue-400' : 'text-white'}`}>
                                                {conv.partner.username}
                                            </h3>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(conv.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <p className="text-slate-400 text-xs truncate">
                                            {conv.lastMessage}
                                        </p>

                                        {conv.productName && (
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                                                <ShoppingBag size={10} />
                                                <span className="truncate max-w-[120px]">{conv.productName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
