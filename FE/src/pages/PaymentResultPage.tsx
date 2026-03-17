import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { CheckCircle, XCircle } from 'lucide-react';
import { createPaymentApi, createAppointmentApi, updateAppointmentStatusApi, deleteAppointmentApi } from '../api';

interface Payment {
  service?: {
    name: string;
    price: number;
  };
  consultant?: {
    accountId?: {
      fullName: string;
    };
  };
  slot?: {
    day: string;
    time: string;
  };
  dateStr?: string;
  fullName?: string;
  phone?: string;
  gender?: string;
  reason?: string;
  appointmentId?: string;
  user_id?: string;
  price?: number;
  paymentMethod?: string;
  slotTime_id?: string;
  consultant_id?: string;
  service_id?: string;
  dateBooking?: string;
  note?: string;
  paypalStatus?: string;
}

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);

  // Lấy thêm tham số momoResultCode từ URL
  const momoResultCode = searchParams.get('resultCode');

  useEffect(() => {
    // Get pending bill from localStorage
    const pendingBill = localStorage.getItem('pendingBill');
    if (pendingBill) {
      const paymentObj = JSON.parse(pendingBill);
      setPayment(paymentObj);
      // PAYPAL FLOW
      if (paymentObj.paymentMethod === 'paypal') {
        // Tạo appointment với status mặc định (pending)
        createAppointmentApi({
          slotTime_id: paymentObj.slotTime_id,
          user_id: paymentObj.user_id,
          consultant_id: paymentObj.consultant_id,
          service_id: paymentObj.service_id,
          dateBooking: paymentObj.dateBooking,
          reason: paymentObj.reason,
          note: paymentObj.note,
        })
        .then((appointmentRes) => {
          // Cập nhật status appointment thành confirm
          updateAppointmentStatusApi(appointmentRes._id, 'confirmed')
            .then(() => {
              // Tạo payment record độc lập
              createPaymentApi({
                accountId: paymentObj.user_id,
                appointmentId: appointmentRes._id,
                date: new Date().toISOString(),
                description: `Thanh toán cho lịch hẹn ${appointmentRes._id}`,
                paymentLinkId: appointmentRes._id,
                totalPrice: paymentObj.price || 0,
                status: 'completed',
                paymentMethod: paymentObj.paymentMethod || 'paypal',
              }).catch((err) => {
                console.error('[FE] createPaymentApi error:', err);
              });
            })
            .catch((err) => {
              console.error('[FE] updateAppointmentStatusApi error:', err);
            });
        })
        .catch((err) => {
          console.error('[FE] createAppointmentApi error:', err);
        });
      } else if (paymentObj.paymentMethod === 'momo' && paymentObj.appointmentId) {
        // MOMO FLOW: chỉ xử lý khi thanh toán momo thành công (resultCode === '0')
        if (momoResultCode === '0') {
          updateAppointmentStatusApi(paymentObj.appointmentId, 'confirmed')
            .then(() => {
              createPaymentApi({
                accountId: paymentObj.user_id,
                appointmentId: paymentObj.appointmentId,
                date: new Date().toISOString(),
                description: `Thanh toán cho lịch hẹn ${paymentObj.appointmentId}`,
                paymentLinkId: paymentObj.appointmentId,
                totalPrice: paymentObj.price || 0,
                status: 'completed',
                paymentMethod: paymentObj.paymentMethod || 'momo',
              }).catch((err) => {
                console.error('[FE] createPaymentApi error:', err);
              });
            })
            .catch((err) => {
              console.error('[FE] updateAppointmentStatusApi error:', err);
            });
        } else {
          // Nếu thất bại thì xóa luôn appointment và trả slot
          deleteAppointmentApi(paymentObj.appointmentId)
            .then(() => {
              console.log('[FE] Đã xóa appointment thất bại momo:', paymentObj.appointmentId);
            })
            .catch((err) => {
              console.error('[FE] deleteAppointmentApi error:', err);
            });
        }
      } else {
        // Card giữ nguyên logic cũ
        if (paymentObj.appointmentId) {
          createPaymentApi({
            accountId: paymentObj.user_id,
            appointmentId: paymentObj.appointmentId,
            date: new Date().toISOString(),
            description: `Thanh toán cho lịch hẹn ${paymentObj.appointmentId}`,
            paymentLinkId: paymentObj.appointmentId,
            totalPrice: paymentObj.price || 0,
            status: 'completed',
            paymentMethod: paymentObj.paymentMethod || 'other',
          })
          .then(res => {
            console.log('[FE] createPaymentApi response:', res);
          })
          .catch(err => {
            console.error('[FE] createPaymentApi error:', err);
          });
        }
      }
      // Clear pending bill after loading
      localStorage.removeItem('pendingBill');
    }
  }, []);

  // Cập nhật điều kiện thành công/thất bại:
  const isPaypalSuccess = payment?.paymentMethod === 'paypal' && payment?.paypalStatus === 'COMPLETED';
  const isMomoSuccess = payment?.paymentMethod === 'momo' && momoResultCode === '0';
  const isPaymentSuccess = isPaypalSuccess || isMomoSuccess;

  return (
    <div className="bg-gradient-to-b from-sky-50 to-[#f0f7fa] min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 w-full px-4 py-8 flex flex-col justify-center items-center">
        <div className="w-full max-w-2xl bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl p-10 border border-cyan-100 flex flex-col gap-8 animate-fadeIn">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {isPaymentSuccess ? (
                <CheckCircle className="w-20 h-20 text-green-500" />
              ) : (
                <XCircle className="w-20 h-20 text-red-500" />
              )}
            </div>
            <h2 className={`text-3xl font-bold mb-2 tracking-tight ${
              isPaymentSuccess ? 'text-green-700' : 'text-red-700'
            }`}>
              {isPaymentSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại!'}
            </h2>
            <p className="text-gray-600 text-lg">
              {isPaymentSuccess 
                ? 'Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi.'
                : 'Rất tiếc, giao dịch của bạn không thành công. Vui lòng thử lại.'}
            </p>
          </div>

          {payment && (
            <div className={`p-6 rounded-2xl border shadow-md ${
              isPaymentSuccess 
                ? 'bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-100'
                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-100'
            }`}>
              <div className="flex flex-col gap-4 text-base text-gray-700">
                <div className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-gray-600">Dịch vụ:</span>
                  <span className="font-semibold text-gray-800">{payment.service?.name}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-gray-600">Chuyên viên:</span>
                  <span className="font-semibold text-gray-800">
                    {payment.consultant?.accountId?.fullName || "Không xác định"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-medium text-gray-800">
                    {payment.slot ? `${payment.slot.day}, ${payment.dateStr}, ${payment.slot.time}` : '--'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-gray-600">Khách hàng:</span>
                  <span className="font-medium text-gray-800">{payment.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-gray-600">SĐT:</span>
                  <span className="font-medium text-gray-800">{payment.phone}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-gray-600">Giới tính:</span>
                  <span className="font-medium text-gray-800">
                    {payment.gender === 'male' ? 'Nam' : 'Nữ'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-emerald-100 pb-3">
                  <span className="text-gray-600">Lý do tư vấn:</span>
                  <span className="font-medium text-gray-800">{payment.reason}</span>
                </div>
                <div className="flex justify-between items-center pt-3 text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className={isPaymentSuccess ? 'text-emerald-700' : 'text-red-700'}>
                    {payment.service?.price?.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 mt-6">
            {isPaymentSuccess ? (
              <button 
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-10 py-4 rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => navigate('/')}
              >
                Trở về trang chủ
              </button>
            ) : (
              <>
                <button 
                  className="bg-gray-100 text-gray-700 px-10 py-4 rounded-2xl font-medium hover:bg-gray-200 transition-all duration-200 shadow border border-gray-200"
                  onClick={() => navigate('/')}
                >
                  Về trang chủ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 