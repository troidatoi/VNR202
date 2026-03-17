import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Dữ liệu khái niệm triết học Mác-Lênin
const philosophyConcepts = [
  { id: 1, concept: "Mâu thuẫn", definition: "Hiện tượng khách quan, phổ biến trong mọi sự vật, hiện tượng" },
  { id: 2, concept: "Lượng", definition: "Số lượng, quy mô, tốc độ của sự vật, hiện tượng" },
  { id: 3, concept: "Chất", definition: "Tính chất, đặc điểm cơ bản của sự vật, hiện tượng" },
  { id: 4, concept: "Điểm nút", definition: "Mức độ giới hạn mà tại đó sự tích lũy về lượng dẫn đến bước nhảy vọt về chất" },
  { id: 5, concept: "Bước nhảy vọt", definition: "Sự chuyển hóa từ lượng thành chất, tạo ra sự thay đổi căn bản" },
  { id: 6, concept: "Phủ định", definition: "Quá trình thay thế cái cũ bằng cái mới trong sự phát triển" },
  { id: 7, concept: "Phủ định của phủ định", definition: "Quy luật phát triển theo hình xoáy ốc, phủ định cái cũ để tạo ra cái mới cao hơn" },
  { id: 8, concept: "Thống nhất", definition: "Các mặt đối lập cùng tồn tại trong một thể thống nhất" },
  { id: 9, concept: "Đấu tranh", definition: "Các mặt đối lập loại trừ lẫn nhau, tạo nên động lực phát triển" },
  { id: 10, concept: "Biện chứng", definition: "Phương pháp nhận thức dựa trên sự vận động, phát triển của sự vật" },
  { id: 11, concept: "Duy vật", definition: "Quan điểm cho rằng vật chất là cái có trước, quyết định ý thức" },
  { id: 12, concept: "Duy tâm", definition: "Quan điểm cho rằng ý thức là cái có trước, quyết định vật chất" }
];

interface Card {
  id: number;
  content: string;
  type: 'concept' | 'definition';
  isFlipped: boolean;
  isMatched: boolean;
  pairId: number;
}

interface MemoryGameProps {
  onClose: () => void;
}

const MemoryGame: React.FC<MemoryGameProps> = ({ onClose }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Tạo mảng cards từ dữ liệu
  const createCards = useCallback(() => {
    const newCards: Card[] = [];
    
    // Tạo 6 cặp ngẫu nhiên từ 12 khái niệm
    const shuffledConcepts = [...philosophyConcepts].sort(() => Math.random() - 0.5).slice(0, 6);
    
    shuffledConcepts.forEach((item, index) => {
      // Thêm card khái niệm
      newCards.push({
        id: index * 2,
        content: item.concept,
        type: 'concept',
        isFlipped: false,
        isMatched: false,
        pairId: index
      });
      
      // Thêm card định nghĩa
      newCards.push({
        id: index * 2 + 1,
        content: item.definition,
        type: 'definition',
        isFlipped: false,
        isMatched: false,
        pairId: index
      });
    });
    
    // Xáo trộn cards
    return newCards.sort(() => Math.random() - 0.5);
  }, []);

  // Khởi tạo game
  useEffect(() => {
    setCards(createCards());
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameComplete(false);
    setGameStarted(false);
  }, [createCards]);

  // Xử lý click card
  const handleCardClick = (cardId: number) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    // Cập nhật trạng thái flipped
    setCards(prevCards =>
      prevCards.map(c =>
        c.id === cardId ? { ...c, isFlipped: true } : c
      )
    );

    // Kiểm tra match khi có 2 cards được flip
    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Match thành công
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(c =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setMatches(prev => prev + 1);
          setFlippedCards([]);
        }, 500);
      } else {
        // Không match, lật lại sau 1 giây
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map(c =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Kiểm tra game hoàn thành
  useEffect(() => {
    if (matches === 6) {
      setGameComplete(true);
    }
  }, [matches]);

  // Reset game
  const resetGame = () => {
    setCards(createCards());
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameComplete(false);
    setGameStarted(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🧠 Memory Game - Triết học Mác-Lênin
            </h2>
            <p className="text-gray-600">
              Ghép cặp khái niệm với định nghĩa đúng!
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{moves}</div>
            <div className="text-sm text-amber-700">Lượt chơi</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{matches}</div>
            <div className="text-sm text-green-700">Cặp đúng</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{6 - matches}</div>
            <div className="text-sm text-blue-700">Còn lại</div>
          </div>
        </div>

        {/* Game Complete Modal */}
        <AnimatePresence>
          {gameComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10"
            >
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-white rounded-2xl p-8 text-center max-w-md mx-4"
              >
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Chúc mừng!
                </h3>
                <p className="text-gray-600 mb-4">
                  Bạn đã hoàn thành game với {moves} lượt chơi!
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetGame}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Chơi lại
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Board */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              className={`aspect-square cursor-pointer rounded-xl border-2 transition-all duration-300 ${
                card.isMatched
                  ? 'bg-green-100 border-green-300'
                  : card.isFlipped
                  ? 'bg-amber-100 border-amber-300'
                  : 'bg-gray-100 border-gray-300 hover:border-amber-400'
              }`}
              onClick={() => handleCardClick(card.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                rotateY: card.isFlipped || card.isMatched ? 0 : 180
              }}
              transition={{ duration: 0.6 }}
            >
              <div className="h-full flex items-center justify-center p-3">
                <div className="text-center">
                  {card.isFlipped || card.isMatched ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium text-gray-800 leading-tight"
                    >
                      {card.content}
                    </motion.div>
                  ) : (
                    <div className="text-2xl">❓</div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">📋 Hướng dẫn chơi:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click vào 2 thẻ để lật chúng</li>
            <li>• Ghép khái niệm với định nghĩa đúng</li>
            <li>• Cặp đúng sẽ được giữ nguyên</li>
            <li>• Cặp sai sẽ bị lật lại</li>
            <li>• Hoàn thành tất cả 6 cặp để thắng!</li>
          </ul>
        </div>

        {/* Reset Button */}
        <div className="mt-4 text-center">
          <button
            onClick={resetGame}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            🔄 Chơi lại
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MemoryGame;

