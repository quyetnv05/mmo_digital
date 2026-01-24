
'use client';

import { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatSellerButton({ sellerId, productId }: { sellerId: number, productId: number }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleChat = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId, productId }),
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/dashboard/messages/${data.data.id}`);
            } else {
                if (data.error === 'Cannot chat with yourself') {
                    alert('Bạn không thể tự chat với chính mình!');
                } else if (data.error === 'Unauthorized') {
                    router.push('/auth/login');
                } else {
                    alert('Lỗi: ' + data.error);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleChat}
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-xl border border-slate-700 transition-colors font-medium text-sm"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            Chat với người bán
        </button>
    );
}
