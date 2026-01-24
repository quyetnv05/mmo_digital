
'use client';

import { useState, useRef, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Send, User, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then(res => res.json());

import { useAuth } from '@/components/providers/AuthProvider';

export default function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth(); // Use Auth Context to identify "Me"
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data, mutate, error } = useSWR(`/api/conversations/${id}/messages`, fetcher, {
        refreshInterval: 3000
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [data]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await fetch(`/api/conversations/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage }),
            });
            setNewMessage('');
            mutate();
        } catch (error) {
            console.error('Failed to send', error);
        } finally {
            setSending(false);
        }
    };

    if (error) return <div className="text-center text-red-500 mt-10">Không thể tải đoạn chat</div>;
    if (!data) return <div className="text-center text-slate-500 mt-10">Đang tải...</div>;

    const { conversation, messages } = data.data;

    // Identify Partner Name
    const isBuyer = user?.id === conversation.buyerId;
    const partnerName = isBuyer ? conversation.seller.username : conversation.buyer.username;

    return (
        <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/messages" className="md:hidden text-slate-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="text-white font-bold flex items-center gap-2 text-lg">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {partnerName}
                        </h2>
                        {conversation.product && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <ShoppingBag size={12} />
                                {conversation.product.name}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950">
                {messages.map((msg: any) => {
                    const isMe = msg.senderId === user?.id; // Check based on Auth Context
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`
                                    max-w-[75%] p-3 rounded-2xl border text-sm
                                    ${isMe
                                        ? 'bg-blue-600 text-white border-blue-600 rounded-br-none'
                                        : 'bg-slate-800 text-slate-200 border-slate-700 rounded-bl-none'
                                    }
                                `}
                            >
                                <p>{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2 shrink-0">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                />
                <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-3 rounded-lg transition-colors flex items-center justify-center aspect-square"
                >
                    {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
            </form>
        </div>
    );
}
