
'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Send, AlertTriangle, User as UserIcon, Shield, CheckCircle, XCircle } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';

// Fetcher
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // 1. Fetch Dispute Info (You might need a separate API for getting Single Dispute or just use findMany for list)
    // For now, let's assume we implement GET /api/disputes/[id] OR we pass data via props if Server Component.
    // Client Component approach: fetch /api/disputes/[id] details.
    // BUT we haven't implemented GET /api/disputes/[id] yet, only messages.
    // Let's implement basics first with SWR for messages.

    // We need to fetch Dispute Details too. 
    // Let's assume we add GET /api/disputes/[id] later, for now we can rely on Messages.
    // Wait, better to create GET /api/disputes/[id] route now or just fetch all and filter (bad performance but okay for MVP).
    // Actually, let's fetch messages first.

    // NOTE: We need a way to get the Dispute Info (Order, Product, Status) to display.
    // I will add a GET route in api/disputes/[id]/route.ts in next step.

    const { data: disputeData, error: disputeError } = useSWR(`/api/disputes/${id}`, fetcher);
    const { data: messagesData, mutate: refreshMessages } = useSWR(`/api/disputes/${id}/messages`, fetcher, { refreshInterval: 5000 });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messagesData]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await fetch(`/api/disputes/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage }),
            });
            setNewMessage('');
            refreshMessages();
        } catch (error) {
            console.error('Failed to send', error);
        }
    };

    if (disputeError) return <div className="text-red-500">Error loading dispute</div>;
    if (!disputeData) return <div className="text-slate-400">Loading details...</div>;
    if (disputeData.error || !disputeData.data) return <div className="text-red-500">{disputeData.error || 'Dispute not found'}</div>;

    const dispute = disputeData.data;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
            {/* Left: Dispute Info */}
            <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 h-fit">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-amber-400" />
                    Khiếu nại #{dispute.id}
                </h2>

                <div className="space-y-4 text-sm">
                    <div>
                        <p className="text-slate-400">Trạng thái</p>
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-xs font-bold uppercase">
                            {dispute.status}
                        </span>
                    </div>

                    <div>
                        <p className="text-slate-400">Đơn hàng</p>
                        <Link href={`/dashboard/orders/${dispute.orderId}`} className="text-blue-400 hover:underline">
                            #{dispute.orderId} - {dispute.order.product.name}
                        </Link>
                    </div>

                    <div>
                        <p className="text-slate-400">Lý do</p>
                        <p className="text-white bg-slate-900/50 p-3 rounded border border-slate-700/50">
                            {dispute.reason}
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-400">Giá trị</p>
                        <p className="text-green-400 font-bold">{new Intl.NumberFormat('vi-VN').format(dispute.order.totalPrice)} đ</p>
                    </div>
                </div>
            </div>

            {/* Right: Chat */}
            <div className="lg:col-span-2 flex flex-col bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <MessageSquare size={18} />
                        Trao đổi & Xử lý
                    </h3>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesData?.data?.map((msg: any) => (
                        <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-center' : (msg.senderId === dispute.openedBy ? 'justify-start' : 'justify-end')}`}>
                            {msg.isAdmin && (
                                <div className="text-center w-full my-2">
                                    <span className="text-xs text-slate-500 uppercase font-bold text-amber-500 flex items-center justify-center gap-1">
                                        <Shield size={12} /> System Admin Notification
                                    </span>
                                    <div className="bg-amber-900/20 text-amber-200 text-sm px-4 py-2 rounded-lg inline-block mt-1 border border-amber-500/20">
                                        {msg.content}
                                    </div>
                                </div>
                            )}

                            {!msg.isAdmin && (
                                <div className={`max-w-[70%] rounded-xl p-3 ${msg.senderId === dispute.openedBy // If Sender is Buyer (Opener)
                                    ? 'bg-slate-800 text-white rounded-tl-none'
                                    : 'bg-blue-600 text-white rounded-tr-none' // Seller Rep'
                                    }`}>
                                    <div className="text-xs text-slate-300 mb-1 flex items-center gap-1">
                                        <UserIcon size={12} /> {msg.sender.username}
                                    </div>
                                    <p className="text-sm">{msg.content}</p>
                                    <p className="text-[10px] text-white/50 text-right mt-1">
                                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN')}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {dispute.status === 'OPEN' ? (
                    <form onSubmit={handleSendMessage} className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Nhập nội dung phản hồi..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg">
                            <Send size={20} />
                        </button>
                    </form>
                ) : (
                    <div className="p-4 bg-slate-800 text-center text-slate-500 text-sm">
                        Khiếu nại này đã đóng. Không thể gửi thêm tin nhắn.
                    </div>
                )}
            </div>
        </div>
    );
}

// Icon helper
import { MessageSquare } from 'lucide-react';
