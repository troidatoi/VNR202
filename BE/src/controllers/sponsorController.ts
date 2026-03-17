import { Request, Response } from 'express';
import Sponsor, { ISponsor } from '../models/Sponsor';



// Lấy tất cả sponsors
export const getAllSponsors = async (req: Request, res: Response) => {
  try {
    const sponsors = await Sponsor.find({ status: { $ne: 'isDeleted' } });
    res.status(200).json(sponsors);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhà tài trợ' });
  }
};

// Lấy sponsors theo event
export const getSponsorsByEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    
    const sponsors = await Sponsor.find({ 
      eventIds: eventId, 
      status: { $ne: 'isDeleted' } 
    })
    .populate('eventIds', 'title')
    .sort({ ranking: 1, createdAt: -1 });
    
    res.status(200).json(sponsors);
  } catch (error) {
    console.error('Error fetching sponsors by event:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách nhà tài trợ theo sự kiện' });
  }
};

// Lấy sponsor theo ID
export const getSponsorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sponsor = await Sponsor.findById(id);
    res.status(200).json(sponsor);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin nhà tài trợ' });
  }
};

// Tạo sponsor mới
export const createSponsor = async (req: Request, res: Response) => {
  try {
    const sponsor = new Sponsor(req.body);
    await sponsor.save();
    res.status(201).json(sponsor);
  } catch (error) {
    console.error('Error creating sponsor:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo nhà tài trợ' });
  }
};

// Cập nhật sponsor


// Xóa sponsor (soft delete)
export const deleteSponsor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const sponsor = await Sponsor.findById(id);
    
    if (!sponsor) {
      return res.status(404).json({ message: 'Không tìm thấy nhà tài trợ' });
    }
    
    await Sponsor.findByIdAndUpdate(id, { status: 'isDeleted' });
    
    res.status(200).json({ message: 'Xóa nhà tài trợ thành công' });
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa nhà tài trợ' });
  }
};

// Lấy thống kê sponsors theo ranking
export const getSponsorStats = async (req: Request, res: Response) => {
  try {
    const stats = await Sponsor.aggregate([
      { $match: { status: { $ne: 'isDeleted' } } },
      {
        $group: {
          _id: '$ranking',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const rankingNames = {
      platinum: 'Bạch kim',
      gold: 'Vàng',
      silver: 'Bạc',
      bronze: 'Đồng'
    };
    
    const formattedStats = stats.map(stat => ({
      ranking: stat._id,
      rankingName: rankingNames[stat._id as keyof typeof rankingNames],
      count: stat.count
    }));
    
    res.status(200).json(formattedStats);
  } catch (error) {
    console.error('Error fetching sponsor stats:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê nhà tài trợ' });
  }
}; 