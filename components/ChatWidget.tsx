'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/components/providers/AuthProvider';

interface Message {
    role: 'user' | 'model';
    content: string;
}

export default function ChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Reset chat when user changes (Fix history leak)
    useEffect(() => {
        setMessages([]);
    }, [user?.id]);

    // Handle Send Message
    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        if (!user) {
            setMessages(prev => [...prev,
            { role: 'model', content: 'Vui lòng đăng nhập để sử dụng trợ lý ảo.' }
            ]);
            return;
        }

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.slice(-10) // Only send last 10 messages for context
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: `Lỗi: ${data.error || 'Không thể kết nối'}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', content: 'Lỗi kết nối đến máy chủ.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const dragControls = useDragControls();

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragListener={false}
            dragControls={dragControls}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
        >
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 w-[380px] max-w-[calc(100vw-48px)] h-[500px] max-h-[70vh] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="p-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between cursor-move touch-none select-none"
                        >
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <Bot size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">MMO Assistant</h3>
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag on close button
                            >
                                <Minimize2 size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <Bot size={48} className="text-slate-700 mx-auto mb-3" />
                                    <p className="text-slate-400 text-sm">
                                        Xin chào! Tôi có thể giúp bạn tra cứu số dư, đơn hàng hoặc hướng dẫn nạp tiền.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'model' && (
                                        <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            <Bot size={14} className="text-blue-400" />
                                        </div>
                                    )}

                                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-slate-700 text-slate-200 rounded-bl-none'
                                        }`}>
                                        <ReactMarkdown
                                            components={{
                                                strong: ({ node, ...props }) => <span className="font-bold text-amber-400" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1 mt-1" {...props} />,
                                                li: ({ node, ...props }) => <li className="marker:text-blue-400" {...props} />
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>

                                    {msg.role === 'user' && (
                                        <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            <User size={14} className="text-slate-400" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot size={14} className="text-blue-400" />
                                    </div>
                                    <div className="bg-slate-700 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500 text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    onPointerDown={(e) => dragControls.start(e)}
                    className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center gap-2 group transition-all cursor-move touch-none"
                >
                    <MessageCircle size={24} />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-medium pr-0 group-hover:pr-1 select-none">
                        Chat hỗ trợ
                    </span>
                </motion.button>
            )}
        </motion.div>
    );
}
