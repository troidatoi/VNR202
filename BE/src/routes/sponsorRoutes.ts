import express from 'express';
import {
  getAllSponsors,
  getSponsorsByEvent,
  getSponsorById,
  createSponsor,
  deleteSponsor,
  getSponsorStats
} from '../controllers/sponsorController';
import { authMiddleware, roleMiddleware } from '../middleware';

const router = express.Router();

// Lấy tất cả sponsors
router.get('/', getAllSponsors);

// Lấy sponsors theo event
router.get('/event/:eventId', getSponsorsByEvent);

// Lấy sponsor theo ID
router.get('/:id', getSponsorById);

// Tạo sponsor mới
router.post('/', createSponsor);

// Xóa sponsor
router.delete('/:id',authMiddleware, roleMiddleware(["admin"]), deleteSponsor);

// Lấy thống kê sponsors
router.get('/stats/ranking', getSponsorStats);

export default router; 