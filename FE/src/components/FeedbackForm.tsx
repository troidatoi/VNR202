import React, { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import { createFeedbackApi } from '../api';

interface FeedbackFormProps {
  appointmentId: string;
  serviceId: string;
  accountId: string;
  serviceName: string;
  consultantName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({
  appointmentId,
  serviceId,
  accountId,
  serviceName,
  consultantName,
  onClose,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Vui lòng chọn đánh giá từ 1-5 sao');
      return;
    }
    
    if (!comment.trim()) {
      alert('Vui lòng nhập nhận xét');
      return;
    }

    setIsSubmitting(true);
    try {
      await createFeedbackApi({
        account_id: accountId,
        appointment_id: appointmentId,
        service_id: serviceId,
        rating,
        comment: comment.trim()
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Lỗi khi gửi feedback:', error);
      alert('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Đánh giá dịch vụ</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Dịch vụ:</p>
          <p className="font-medium text-gray-900">{serviceName}</p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Chuyên gia:</p>
          <p className="font-medium text-gray-900">{consultantName}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đánh giá của bạn *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-2xl transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 1 && 'Rất không hài lòng'}
              {rating === 2 && 'Không hài lòng'}
              {rating === 3 && 'Bình thường'}
              {rating === 4 && 'Hài lòng'}
              {rating === 5 && 'Rất hài lòng'}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhận xét của bạn *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/500 ký tự
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || !comment.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg hover:from-sky-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Gửi đánh giá
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm; 