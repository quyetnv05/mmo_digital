'use client';

import { MessageSquare } from 'lucide-react';
import ConversationList from '@/components/messages/ConversationList';

export default function MessagesPage() {
    return (
        <>
            {/* Mobile View: Just Show List directly if no chat selected */}
            <div className="md:hidden h-full">
                <ConversationList />
            </div>

            {/* Desktop View: Empty State */}
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare size={40} className="text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Chào mừng đến với MMO Chat</h2>
                <p className="text-slate-400 max-w-sm">
                    Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu nhắn tin.
                </p>
                <div className="mt-8 p-4 bg-slate-800/50 rounded-lg text-xs text-slate-500 max-w-md border border-slate-700/50">
                    <p>⚠️ Lưu ý: Không giao dịch bên ngoài nền tảng để tránh lừa đảo.</p>
                </div>
            </div>
        </>
    );
}
