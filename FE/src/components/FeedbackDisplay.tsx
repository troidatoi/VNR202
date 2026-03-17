import React from 'react';
import { Star, MessageCircle } from 'lucide-react';

interface Feedback {
  _id: string;
  rating: number;
  comment: string;
  feedback_date: string;
  account_id: {
    fullName?: string;
    username?: string;
  };
}

interface FeedbackDisplayProps {
  feedbacks: Feedback[];
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedbacks }) => {
  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Chưa có đánh giá nào cho dịch vụ này</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-sky-600" />
        Đánh giá từ khách hàng ({feedbacks.length})
      </h4>
      
      {feedbacks.map((feedback) => (
        <div key={feedback._id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= feedback.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {feedback.rating}/5
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(feedback.feedback_date).toLocaleDateString('vi-VN')}
            </span>
          </div>
          
          <p className="text-gray-700 text-sm leading-relaxed">
            {feedback.comment}
          </p>
          
          <div className="mt-2 text-xs text-gray-500">
            - {feedback.account_id?.fullName || feedback.account_id?.username || 'Khách hàng'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeedbackDisplay; 