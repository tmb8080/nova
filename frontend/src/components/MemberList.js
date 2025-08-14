import React, { useState, useEffect, useRef } from 'react';

const MemberList = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  // Static member data based on the image description
  const members = [
    {
      id: 18,
      email: "****9179@gmail.com",
      vipLevel: "V9",
      earnings: 3694.8,
      badge: "purple-gold-crown"
    },
    {
      id: 19,
      email: "****9508",
      vipLevel: "V3",
      earnings: 80,
      badge: "orange-gold-star"
    },
    {
      id: 20,
      email: "****5968@gmail.com",
      vipLevel: "V10",
      earnings: 14020.9,
      badge: "purple-gold-winged-crown"
    },
    {
      id: 21,
      email: "****7559",
      vipLevel: "V1",
      earnings: 3,
      badge: "bronze-w"
    },
    {
      id: 22,
      email: "****8530",
      vipLevel: "V4",
      earnings: 188.9,
      badge: "blue-silver-diamond"
    },
    {
      id: 23,
      email: "****5622",
      vipLevel: "V1",
      earnings: 3,
      badge: "bronze-w"
    }
  ];

  // Duplicate the array to create seamless scrolling
  const duplicatedMembers = [...members, ...members];

  const getBadgeIcon = (badgeType) => {
    switch (badgeType) {
      case "purple-gold-crown":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case "orange-gold-star":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case "purple-gold-winged-crown":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case "bronze-w":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
        );
      case "blue-silver-diamond":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-gray-400 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(amount);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        // Reset to 0 when we reach the end of the original array
        if (nextIndex >= members.length) {
          return 0;
        }
        return nextIndex;
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollHeight = scrollRef.current.scrollHeight / 2; // Since we duplicated the array
      const itemHeight = scrollHeight / members.length;
      const scrollTo = currentIndex * itemHeight;
      
      scrollRef.current.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/80 to-teal-600/80 backdrop-blur-sm px-4 py-3">
        <h2 className="text-white text-lg font-semibold flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
          </svg>
          Member List
        </h2>
      </div>

      {/* Member List Container */}
      <div className="relative">
        <div 
          ref={scrollRef}
          className="max-h-64 overflow-hidden"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-0">
            {duplicatedMembers.map((member, index) => (
              <div 
                key={`${member.id}-${index}`}
                className="flex items-center justify-between p-4 border-b border-white/20 hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
              >
                {/* Left side - Number and Badge */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-300 font-medium min-w-[2rem]">
                    {member.id}
                  </span>
                  {getBadgeIcon(member.badge)}
                </div>

                {/* Center - Member Info */}
                <div className="flex-1 ml-4">
                  <div className="text-sm text-white font-medium">
                    Congratulate {member.email} Earn
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1">
                    {member.vipLevel}
                  </div>
                </div>

                {/* Right side - Earnings */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                  USD{formatCurrency(member.earnings)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            {members.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-emerald-400' 
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/10 backdrop-blur-sm px-4 py-2 border-t border-white/20">
        
      </div>
    </div>
  );
};

export default MemberList;
