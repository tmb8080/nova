import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ 
  targetTime, 
  onComplete, 
  className = "",
  showLabel = true,
  size = "default" 
}) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const difference = target - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          hours,
          minutes,
          seconds,
          total: difference
        });
      } else {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        });
        if (onComplete) {
          onComplete();
        }
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "text-sm";
      case "large":
        return "text-2xl font-bold";
      case "xl":
        return "text-3xl font-bold";
      default:
        return "text-lg font-semibold";
    }
  };

  const formatTime = (value) => {
    return value.toString().padStart(2, '0');
  };

  if (timeLeft.total <= 0) {
    return (
      <div className={`text-green-500 ${getSizeClasses()} ${className}`}>
        ✅ Ready to start!
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">
          Next task available in:
        </div>
      )}
      <div className={`text-yellow-500 dark:text-yellow-400 ${getSizeClasses()}`}>
        {timeLeft.hours > 0 && `${formatTime(timeLeft.hours)}h `}
        {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
      </div>
    </div>
  );
};

export default CountdownTimer;
