import React, { useEffect, useState } from 'react';
import api from '../api';

interface ISponsor {
  _id: string;
  fullName: string;
  email: string;
  ranking: 'platinum' | 'gold' | 'silver' | 'bronze';
  status: 'active' | 'inactive' | 'isDeleted';
}

interface SponsorListProps {
  eventId: string;
}

const SponsorList: React.FC<SponsorListProps> = ({ eventId }) => {
  const [sponsors, setSponsors] = useState<ISponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/sponsors/event/${eventId}`);
        setSponsors(response.data);
      } catch (error) {
        console.error('Error fetching sponsors:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchSponsors();
    }
  }, [eventId]);

  const getRankingColor = (ranking: string) => {
    switch (ranking) {
      case 'platinum':
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
      case 'gold':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300';
      case 'silver':
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300';
      case 'bronze':
        return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getRankingName = (ranking: string) => {
    switch (ranking) {
      case 'platinum':
        return 'Bạch kim';
      case 'gold':
        return 'Vàng';
      case 'silver':
        return 'Bạc';
      case 'bronze':
        return 'Đồng';
      default:
        return ranking;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có nhà tài trợ</h3>
        <p className="mt-1 text-sm text-gray-500">Sự kiện này chưa có nhà tài trợ nào.</p>
      </div>
    );
  }

  // Sắp xếp sponsors theo ranking (platinum > gold > silver > bronze)
  const sortedSponsors = [...sponsors].sort((a, b) => {
    const rankingOrder = { platinum: 4, gold: 3, silver: 2, bronze: 1 };
    return rankingOrder[b.ranking] - rankingOrder[a.ranking];
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Nhà tài trợ</h3>
        <p className="text-sm text-gray-500">Danh sách các nhà tài trợ cho sự kiện này</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSponsors.map((sponsor) => (
            <div
              key={sponsor._id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{sponsor.fullName}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${getRankingColor(sponsor.ranking)}`}>
                  {getRankingName(sponsor.ranking)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{sponsor.email}</p>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    sponsor.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {sponsor.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SponsorList; 