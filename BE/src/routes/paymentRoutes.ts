import express from 'express';
import { createMomoPayment, handleMomoCallback, createVnpayPayment, handleVnpayIpn, createPayment, getAllPayments, getPaymentById, updatePayment, deletePayment, getTotalRevenue, getWeeklyRevenue, getMonthlyRevenue, getRevenueByService, getPaymentByAppointmentId, getYearlyRevenue } from '../controllers/paymentController';
import { authMiddleware, roleMiddleware } from '../middleware';
const router = express.Router();

router.post('/momo/create-payment', createMomoPayment);
router.post('/momo/callback', handleMomoCallback);

// VNPay Routes
router.post('/vnpay/create-payment', createVnpayPayment);
router.get('/vnpay/ipn', handleVnpayIpn);

// Test route không cần auth
router.get('/test', getAllPayments);

router.post('/', authMiddleware, createPayment);
router.get('/', authMiddleware,getAllPayments);
router.get('/:id', getPaymentById);
router.put('/:id', authMiddleware,updatePayment);
router.delete('/:id', authMiddleware,deletePayment);

// Thêm các routes thống kê doanh thu
router.get('/statistics/total', authMiddleware,roleMiddleware(["admin"]),getTotalRevenue);
router.get('/statistics/weekly', authMiddleware,roleMiddleware(["admin"]),getWeeklyRevenue);
router.get('/statistics/monthly', authMiddleware,roleMiddleware(["admin"]),getMonthlyRevenue);
router.get('/statistics/yearly', authMiddleware,roleMiddleware(["admin"]),getYearlyRevenue);
router.get('/statistics/by-service', authMiddleware,roleMiddleware(["admin"]),getRevenueByService);

// Thêm route lấy payment theo appointmentId
router.get('/by-appointment/:appointmentId', getPaymentByAppointmentId);

export default router; 