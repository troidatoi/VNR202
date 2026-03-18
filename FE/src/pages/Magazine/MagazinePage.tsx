import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Page1Img from "../../assets/1.png";
import Page2Img from "../../assets/2.png";
import Page3Img from "../../assets/3.png";
import Page4Img from "../../assets/4.png";
import Page5Img from "../../assets/5.png";
import Page6Img from "../../assets/6.png";
import Page7Img from "../../assets/7.png";
import Page8Img from "../../assets/8.png";
import Page9Img from "../../assets/9.png";
import Page10Img from "../../assets/10.png";
import Page11Img from "../../assets/11.png";
import Page12Img from "../../assets/12.png";
import Page13Img from "../../assets/13.png";
import Page14Img from "../../assets/14.png";
import Page15Img from "../../assets/15.png";



const MagazinePage: React.FC = () => {
    const [currentSpread, setCurrentSpread] = useState(0);
    const totalPages = 18; // Updated to match actual number of pages
    const totalSpreads = Math.ceil(totalPages / 2);

    const nextPage = () => setCurrentSpread((prev) => Math.min(prev + 1, totalSpreads - 1));
    const prevPage = () => setCurrentSpread((prev) => Math.max(prev - 1, 0));

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") nextPage();
            if (e.key === "ArrowLeft") prevPage();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const renderPageContent = (index: number) => {
        if (index < 0 || index >= totalPages) return null;

        // Map of page images
        const pageImages: { [key: number]: string } = {
            0: Page1Img,
            1: Page2Img,
            2: Page3Img,
            3: Page4Img,
            4: Page5Img,
            5: Page6Img,
            6: Page7Img,
            7: Page8Img,
            8: Page9Img,
            9: Page10Img,
            10: Page11Img,
            11: Page12Img,
            12: Page13Img,
            13: Page14Img,
            14: Page15Img,

        };

        // If we have an image for this page, display it
        if (pageImages[index]) {
            return (
                <img
                    src={pageImages[index]}
                    alt={`Trang ${index + 1}`}
                    className="h-full w-auto object-contain select-none pointer-events-none shadow-sm"
                />
            );
        }

        // Fallback for pages without images
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-10 font-serif opacity-30">
                <h2 className="text-3xl font-bold text-amber-900 mb-4 uppercase">Trang {index + 1}</h2>
                <p className="text-xl text-stone-600 italic">Hết nội dung</p>
                <div className="mt-8 text-6xl">📖</div>
            </div>
        );
    };

    // Simplified spread logic for side-by-side viewing starting from page 0
    const leftPageIndex = currentSpread * 2;
    const rightPageIndex = currentSpread * 2 + 1;

    return (
        <div className="min-h-screen flex flex-col bg-[#f0ebd8]">
            <Header />

            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 lg:p-8 gap-8 overflow-hidden">
                {/* Left Section: Magazine (Natural Photo Display) */}
                <div className="flex-[3] flex items-center justify-center w-full px-4 overflow-hidden h-[75vh]">
                    <div className="flex h-full items-center justify-center relative gap-0">
                        {/* Left Page Container */}
                        <div className="h-full flex items-center justify-end overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`left-${currentSpread}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    {renderPageContent(leftPageIndex)}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Thin Spine Line */}
                        <div className="h-[95%] w-[1px] bg-black/10 z-20 shadow-[0_0_8px_rgba(0,0,0,0.05)]"></div>

                        {/* Right Page Container */}
                        <div className="h-full flex items-center justify-start overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`right-${currentSpread}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    {renderPageContent(rightPageIndex)}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right Section: Controls Sidebar */}
                <div className="w-full lg:w-80 flex flex-col items-center justify-center gap-8 bg-white/40 backdrop-blur-md p-8 rounded-3xl border border-white shadow-xl">
                    <div className="text-center">
                        <h2 className="text-3xl font-serif text-amber-900 font-bold mb-1">VNR202_Nhóm 3</h2>
                        <p className="text-stone-500 uppercase tracking-widest text-xs">Phát hành 2026</p>
                    </div>

                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={prevPage}
                                disabled={currentSpread === 0}
                                className="w-14 h-14 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-amber-900 hover:bg-amber-800 hover:text-white transition-all disabled:opacity-20"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="text-center min-w-[100px]">
                                <div className="text-amber-900 font-bold text-2xl leading-none">{currentSpread + 1}</div>
                                <div className="text-stone-500 text-[10px] uppercase mt-1">Bản thảo</div>
                            </div>
                            <button
                                onClick={nextPage}
                                disabled={currentSpread === totalSpreads - 1}
                                className="w-14 h-14 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center text-amber-900 hover:bg-amber-800 hover:text-white transition-all disabled:opacity-20"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>

                        {/* Progress Indicator */}
                        <div className="w-full mt-4">
                            <div className="flex justify-between text-[10px] text-stone-400 uppercase mb-2">
                                <span>Tiến độ</span>
                                <span>{Math.round(((currentSpread + 1) / totalSpreads) * 100)}%</span>
                            </div>
                            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-amber-900"
                                    animate={{ width: `${((currentSpread + 1) / totalSpreads) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full border-t border-stone-200 pt-6">
                        <p className="text-stone-600 text-sm italic text-center leading-relaxed">
                            Mẹo: Bạn có thể sử dụng phím mũi tên trên bàn phím để lật trang nhanh hơn.
                        </p>
                    </div>

                    <button
                        onClick={() => setCurrentSpread(0)}
                        className="mt-auto text-amber-800 text-sm font-semibold hover:underline"
                    >
                        Quay lại trang đầu
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default MagazinePage;
