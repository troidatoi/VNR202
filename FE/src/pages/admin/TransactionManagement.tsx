import React, { useState, useEffect } from 'react';
import { getAllPaymentsApi } from '../../api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Search, Filter, Eye, Download, Calendar, DollarSign, CreditCard, User, Clock } from 'lucide-react';

interface PaymentUser {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

interface PaymentAppointment {
  _id: string;
  dateBooking: string;
  reason: string;
  status: string;
  user_id: PaymentUser;
  consultant_id: {
    _id: string;
    accountId: PaymentUser;
  };
  service_id: {
    _id: string;
    name: string;
    price: number;
  };
}

interface Payment {
  _id: string;
  accountId: PaymentUser;
  appointmentId: PaymentAppointment;
  date: string;
  description: string;
  paymentLinkId: string;
  totalPrice: number;
  status: "pending" | "completed" | "failed";
  paymentMethod: "paypal" | "momo" | "vnpay" | "cash" | "other";
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  failed: 'bg-rose-50 text-rose-800 border-rose-200'
};

const statusLabels = {
  pending: 'Chờ thanh toán',
  completed: 'Đã hoàn thành',
  failed: 'Thất bại'
};

const paymentMethodColors = {
  paypal: 'bg-amber-50 text-amber-800 border-amber-200',
  momo: 'bg-pink-50 text-pink-800 border-pink-200',
  vnpay: 'bg-green-50 text-green-800 border-green-200',
  cash: 'bg-gray-50 text-gray-800 border-gray-200',
  other: 'bg-purple-50 text-purple-800 border-purple-200'
};

const paymentMethodLabels = {
  paypal: 'PayPal',
  momo: 'MoMo',
  vnpay: 'VNPay',
  cash: 'Tiền mặt',
  other: 'Khác'
};

const TransactionManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, statusFilter, methodFilter, searchTerm, dateFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await getAllPaymentsApi();
      const paymentsData = Array.isArray(response) ? response : response.data || [];
      setPayments(paymentsData);
      
      // Calculate statistics
      const total = paymentsData.length;
      const completed = paymentsData.filter(p => p.status === 'completed').length;
      const pending = paymentsData.filter(p => p.status === 'pending').length;
      const failed = paymentsData.filter(p => p.status === 'failed').length;
      const totalRevenue = paymentsData
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.totalPrice, 0);
      
      setStats({ total, completed, pending, failed, totalRevenue });
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Filter by payment method
    if (methodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMethod === methodFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate >= monthAgo;
          });
          break;
      }
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.accountId.fullName.toLowerCase().includes(term) ||
        payment.accountId.email.toLowerCase().includes(term) ||
        payment.paymentLinkId.toLowerCase().includes(term) ||
        payment.description.toLowerCase().includes(term) ||
        payment.appointmentId.service_id.name.toLowerCase().includes(term)
      );
    }

    setFilteredPayments(filtered);
  };

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPayment(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  const exportToCSV = () => {
    const headers = [
      'ID Giao dịch',
      'Khách hàng',
      'Email',
      'Dịch vụ',
      'Số tiền',
      'Phương thức',
      'Trạng thái',
      'Ngày tạo',
      'Mô tả'
    ];

    const csvData = filteredPayments.map(payment => [
      payment.paymentLinkId,
      payment.accountId.fullName,
      payment.accountId.email,
      payment.appointmentId.service_id.name,
      payment.totalPrice,
      paymentMethodLabels[payment.paymentMethod],
      statusLabels[payment.status],
      formatDate(payment.date),
      payment.description
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Giao dịch</h1>
          <p className="text-gray-600">Theo dõi và quản lý tất cả giao dịch thanh toán trong hệ thống</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Tổng giao dịch</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Đang chờ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-rose-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Thất bại</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm giao dịch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="failed">Thất bại</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">Tất cả phương thức</option>
              <option value="momo">MoMo</option>
              <option value="vnpay">VNPay</option>
              <option value="paypal">PayPal</option>
              <option value="cash">Tiền mặt</option>
              <option value="other">Khác</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
            </select>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất CSV
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Hiển thị {filteredPayments.length} trong tổng số {payments.length} giao dịch
          </p>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giao dịch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dịch vụ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phương thức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.paymentLinkId}</p>
                        <p className="text-xs text-gray-500">{payment._id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{payment.accountId.fullName}</p>
                          <p className="text-xs text-gray-500">{payment.accountId.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900">{payment.appointmentId.service_id.name}</p>
                        <p className="text-xs text-gray-500">{payment.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.totalPrice)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${paymentMethodColors[payment.paymentMethod]}`}>
                        {paymentMethodLabels[payment.paymentMethod]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusColors[payment.status]}`}>
                        {statusLabels[payment.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handlePaymentClick(payment)}
                        className="text-amber-600 hover:text-amber-900 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có giao dịch nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Chi tiết Giao dịch</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Transaction Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin Giao dịch</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">ID Giao dịch:</p>
                      <p className="font-medium">{selectedPayment.paymentLinkId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Trạng thái:</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusColors[selectedPayment.status]}`}>
                        {statusLabels[selectedPayment.status]}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Số tiền:</p>
                      <p className="font-medium text-lg text-green-600">{formatCurrency(selectedPayment.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phương thức:</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${paymentMethodColors[selectedPayment.paymentMethod]}`}>
                        {paymentMethodLabels[selectedPayment.paymentMethod]}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Ngày tạo:</p>
                      <p className="font-medium">{formatDate(selectedPayment.date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mô tả:</p>
                      <p className="font-medium">{selectedPayment.description}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin Khách hàng</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Họ tên:</p>
                      <p className="font-medium">{selectedPayment.accountId.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email:</p>
                      <p className="font-medium">{selectedPayment.accountId.email}</p>
                    </div>
                    {selectedPayment.accountId.phoneNumber && (
                      <div>
                        <p className="text-gray-500">Số điện thoại:</p>
                        <p className="font-medium">{selectedPayment.accountId.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin Lịch hẹn</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Dịch vụ:</p>
                      <p className="font-medium">{selectedPayment.appointmentId.service_id.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ngày hẹn:</p>
                      <p className="font-medium">{formatDate(selectedPayment.appointmentId.dateBooking)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lý do:</p>
                      <p className="font-medium">{selectedPayment.appointmentId.reason}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Trạng thái lịch hẹn:</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusColors[selectedPayment.appointmentId.status as keyof typeof statusColors] || 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                        {statusLabels[selectedPayment.appointmentId.status as keyof typeof statusLabels] || selectedPayment.appointmentId.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement; 