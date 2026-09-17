'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Review {
  id: string;
  client: string;
  location: string;
  project: string;
  date: string;
  rating: number;
  badges?: string[];
  quote: string;
  initials: string;
  avatarGradient: string;
}

const REVIEWS: Review[] = [
  {
    id: 'zanni',
    client: 'Zanni',
    location: 'Bulgaria',
    project: 'React Native Developer Needed for Web App to Mobile App Migration',
    date: 'Apr 2026',
    rating: 5.0,
    badges: ['Committed to Quality', 'Solution Oriented', 'Clear Communicator'],
    quote:
      'Great work! His dedication to achieving the goal and meeting deadlines was outstanding, and he went above and beyond when we needed to hit an important deadline. Communication was excellent — professional, friendly, and always available. Very reliable, highly skilled technically, and quick to solve issues and implement features.',
    initials: 'Z',
    avatarGradient: 'from-amber-500 to-indigo-600',
  },
  {
    id: 'akshios',
    client: 'Akshios Jois',
    location: 'United States',
    project: 'React Native Developer - URGENT/ Immediate Fix',
    date: 'Nov 2025',
    rating: 5.0,
    badges: ['Top Rated Quality', 'Fast Turnaround'],
    quote:
      'Inayat has done an outstanding job building the iOS app using React Native. His technical expertise, problem-solving mindset, and attention to detail are evident in every part of the final product. Throughout the project, he approached challenges with professionalism and creativity, ensuring smooth performance and a polished user experience. Truly exceptional work by Inayat!',
    initials: 'AJ',
    avatarGradient: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'nikhil',
    client: 'Nikhil Chug',
    location: 'United States',
    project: 'Add IAP (In-App Purchases) to React Native App for Android and iOS',
    date: 'Feb 2025',
    rating: 5.0,
    badges: ['RevenueCat & Stripe', 'Flawless Payments'],
    quote:
      'Project was clearly understood, task was done correctly. Code works perfect. Communication was great and daily on task status. A+ work.',
    initials: 'NC',
    avatarGradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'miron',
    client: 'Miron',
    location: 'Germany',
    project: 'Fixing React Native iOS App Startup Crash',
    date: 'Jul 2025',
    rating: 5.0,
    badges: ['Crash Triage', 'On-Time Delivery'],
    quote:
      'Great work. Everything was on point and in time. Diagnosed the native startup crash rapidly and released the patch with zero downtime.',
    initials: 'M',
    avatarGradient: 'from-rose-500 to-amber-600',
  },
  {
    id: 'rasheed',
    client: 'Rasheed Nazar',
    location: 'United Kingdom',
    project: 'Mobile App Development (Long-term Partnership)',
    date: 'Jul 2024',
    rating: 5.0,
    badges: ['High Dedication', 'Long-term Reliable'],
    quote:
      'Inayat is one of the best freelance professionals who achieve tasks with commitment and dedication.',
    initials: 'RN',
    avatarGradient: 'from-purple-600 to-pink-600',
  },
];

export default function ReviewCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const total = REVIEWS.length;

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  // Auto-advance every 7 seconds when not hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setTouchStartX(null);
  };

  // Helper to get relative item indices for 3-card layout
  const prevIndex = (currentIndex - 1 + total) % total;
  const nextIndex = (currentIndex + 1) % total;

  const currentReview = REVIEWS[currentIndex];
  const prevReview = REVIEWS[prevIndex];
  const nextReview = REVIEWS[nextIndex];

  return (
    <div
      className="w-full relative py-6 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Carousel Stage */}
      <div className="relative min-h-[460px] sm:min-h-[420px] flex items-center justify-center overflow-hidden px-2 sm:px-4">
        {/* Desktop Left Card (Perspective Scaled Down) */}
        <div
          onClick={handlePrev}
          className="hidden md:block absolute left-0 lg:left-4 w-[340px] lg:w-[380px] p-6 rounded-3xl bg-slate-900/60 border border-slate-800/60 transform -translate-x-4 scale-90 opacity-40 hover:opacity-75 transition-all duration-500 ease-out cursor-pointer z-10 filter blur-[0.5px]"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center space-x-1 text-amber-400 text-xs">
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">{prevReview.location}</span>
          </div>
          <p className="text-xs text-slate-300 italic font-serif line-clamp-4 leading-relaxed">
            "{prevReview.quote}"
          </p>
          <div className="mt-4 flex items-center space-x-2.5 pt-3 border-t border-slate-800/60">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${prevReview.avatarGradient} flex items-center justify-center text-xs font-bold text-white`}>
              {prevReview.initials}
            </div>
            <div className="truncate">
              <div className="font-bold text-white text-xs truncate">{prevReview.client}</div>
              <div className="text-[10px] text-slate-500 truncate">{prevReview.project}</div>
            </div>
          </div>
        </div>

        {/* Active Center Card (Highlighted, Large, Scale 105, Full Content) */}
        <div className="w-full max-w-xl p-6 sm:p-9 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 transform scale-100 sm:scale-105 transition-all duration-500 ease-out z-20 relative">
          {/* Ambient Glow */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-500/15 blur-2xl rounded-full pointer-events-none" />

          {/* Top Bar: Rating & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center space-x-1.5 text-amber-400 text-sm">
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <span className="ml-2 font-bold text-white text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                5.0 / 5.0
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {currentReview.badges?.map((badge, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Quote */}
          <blockquote className="text-sm sm:text-base text-slate-100 italic font-serif leading-relaxed min-h-[110px] sm:min-h-[96px]">
            "{currentReview.quote}"
          </blockquote>

          {/* Client Details Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentReview.avatarGradient} p-0.5 shadow-lg flex-shrink-0`}
              >
                <div className="w-full h-full rounded-[14px] bg-slate-950/80 flex items-center justify-center text-sm font-black text-white">
                  {currentReview.initials}
                </div>
              </div>

              <div>
                <div className="font-bold text-white text-sm sm:text-base flex items-center space-x-2">
                  <span>{currentReview.client}</span>
                  <span className="text-xs text-slate-400 font-normal">
                    • {currentReview.location}
                  </span>
                </div>
                <div className="text-xs text-slate-400 max-w-sm truncate mt-0.5">
                  {currentReview.project}
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0 hidden sm:block">
              <div className="text-xs font-bold text-emerald-400">
                {currentReview.earnings || 'Verified Contract'}
              </div>
              <div className="text-[11px] text-slate-500">{currentReview.date}</div>
            </div>
          </div>
        </div>

        {/* Desktop Right Card (Perspective Scaled Down) */}
        <div
          onClick={handleNext}
          className="hidden md:block absolute right-0 lg:right-4 w-[340px] lg:w-[380px] p-6 rounded-3xl bg-slate-900/60 border border-slate-800/60 transform translate-x-4 scale-90 opacity-40 hover:opacity-75 transition-all duration-500 ease-out cursor-pointer z-10 filter blur-[0.5px]"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center space-x-1 text-amber-400 text-xs">
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
              <i className="fa-solid fa-star"></i>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">{nextReview.location}</span>
          </div>
          <p className="text-xs text-slate-300 italic font-serif line-clamp-4 leading-relaxed">
            "{nextReview.quote}"
          </p>
          <div className="mt-4 flex items-center space-x-2.5 pt-3 border-t border-slate-800/60">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${nextReview.avatarGradient} flex items-center justify-center text-xs font-bold text-white`}>
              {nextReview.initials}
            </div>
            <div className="truncate">
              <div className="font-bold text-white text-xs truncate">{nextReview.client}</div>
              <div className="text-[10px] text-slate-500 truncate">{nextReview.project}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls Bar */}
      <div className="flex items-center justify-center space-x-6 mt-8">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          aria-label="Previous review"
          className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <i className="fa-solid fa-chevron-left text-sm"></i>
        </button>

        {/* Indicator Dots */}
        <div className="flex items-center space-x-2">
          {REVIEWS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to review ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? 'w-8 bg-gradient-to-r from-amber-400 to-amber-500 shadow-md shadow-amber-500/30'
                  : 'w-2.5 bg-slate-800 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          aria-label="Next review"
          className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <i className="fa-solid fa-chevron-right text-sm"></i>
        </button>
      </div>

      {/* Counter Label */}
      <div className="text-center text-xs text-slate-500 mt-3 font-medium">
        Review {currentIndex + 1} of {total} • <span className="text-slate-400">Verified Upwork Contract</span>
      </div>
    </div>
  );
}
