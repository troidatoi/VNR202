import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chatWithAIApi } from "../../api";

interface Message {
    role: "user" | "model";
    parts: { text: string }[];
}

const AIChatBox: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: "user",
            parts: [{ text: input.trim() }],
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                parts: m.parts
            }));

            const data = await chatWithAIApi(input.trim(), history);

            const aiMessage: Message = {
                role: "model",
                parts: [{ text: data.reply }],
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: Message = {
                role: "model",
                parts: [{ text: "Xin lỗi, tôi gặp chút trục trặc. Bạn vui lòng thử lại sau nhé!" }],
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-amber-100 flex flex-col overflow-hidden"
                        style={{ height: "500px" }}
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-xl">🤖</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Trợ Lý AI - VNR202</h3>
                                    <p className="text-xs opacity-80">Chuyên về lịch sử Đảng</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-1 rounded-full transition-colors"
                                aria-label="Đóng Chat"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto bg-amber-50/30 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center py-10">
                                    <span className="text-4xl block mb-2">👋</span>
                                    <p className="text-amber-800 font-medium">Xin chào! Tôi hỗ trợ môn VNR202</p>
                                    <p className="text-xs text-amber-600 mt-1">Hỏi tôi về lịch sử Đảng nhé.</p>
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === "user"
                                        ? "bg-amber-600 text-white rounded-tr-none"
                                        : "bg-white text-amber-900 shadow-sm border border-amber-100 rounded-tl-none"
                                        }`}>
                                        {m.parts[0].text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-amber-100">
                                        <div className="flex space-x-1">
                                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-amber-100 flex items-center space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Nhập tin nhắn..."
                                className="flex-1 bg-amber-50 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white p-2 rounded-full transition-all shadow-md active:scale-95"
                            >
                                <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full shadow-2xl flex items-center justify-center text-white relative group"
                aria-label="Mở Chat"
            >
                {isOpen ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative">
                        <span className="text-3xl">🤖</span>
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                )}
                <div className="absolute right-full mr-4 bg-amber-900 text-white text-xs py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Hỏi AI nhé!
                </div>
            </motion.button>
        </div>
    );
};

export default AIChatBox;
