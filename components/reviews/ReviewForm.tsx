'use client';

import { useState } from 'react';
import { Star, Loader2, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ReviewFormProps {
    productId: number;
    onReviewSuccess?: () => void;
}

export default function ReviewForm({ productId, onReviewSuccess }: ReviewFormProps) {
    const router = useRouter();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (comment.trim().length < 5) {
            toast.error('Nội dung đánh giá quá ngắn');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, rating, comment }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Gửi đánh giá thành công!');
                setComment('');
                setRating(5);
                router.refresh(); // Refresh server components to show new review
                if (onReviewSuccess) onReviewSuccess();
            } else {
                toast.error(data.error || 'Gửi đánh giá thất bại');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Viết đánh giá của bạn</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star Rating */}
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none transition-colors"
                        >
                            <Star
                                size={28}
                                className={`${(hoverRating || rating) >= star
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-600'
                                    }`}
                            />
                        </button>
                    ))}
                    <span className="ml-2 text-sm text-slate-400 font-medium">
                        {hoverRating || rating} sao
                    </span>
                </div>

                {/* Comment */}
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 min-h-[100px]"
                />

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Gửi đánh giá
                    </button>
                </div>
            </form>
        </div>
    );
}
