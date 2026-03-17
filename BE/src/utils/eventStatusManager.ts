import cron from 'node-cron';
import Event from '../models/Event';

export const updateEventStatus = async () => {
  const now = new Date();

  try {
    // Cập nhật các event từ upcoming sang ongoing, loại trừ cancelled
    const upcomingToOngoing = await Event.updateMany(
      {
        $and: [
          { status: 'upcoming' },
          { startDate: { $lte: now } },
          { status: { $ne: 'cancelled' } }
        ]
      },
      { 
        $set: { 
          status: 'ongoing',
          updatedAt: now 
        } 
      }
    );

    // Cập nhật các event từ ongoing sang completed, loại trừ cancelled
    const ongoingToCompleted = await Event.updateMany(
      {
        $and: [
          { status: 'ongoing' },
          { endDate: { $lte: now } },
          { status: { $ne: 'cancelled' } }
        ]
      },
      {   
        $set: { 
          status: 'completed',
          updatedAt: now 
        } 
      }
    );

    // console.log(`Event status updated: ${upcomingToOngoing.modifiedCount} to ongoing, ${ongoingToCompleted.modifiedCount} to completed`);
  } catch (error) {
    console.error('Error updating event status:', error);
  }
};

export const startEventStatusCron = () => {
  // Chạy mỗi phút
  cron.schedule('* * * * *', updateEventStatus);
  console.log('Event status cron job started');
}; 