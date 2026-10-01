"use client";

import { useState, useEffect } from "react";

export default function FlashSaleTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // If no end date, default to 2 days from now for demo
    const targetDate = endDate ? new Date(endDate).getTime() : new Date().getTime() + 2 * 24 * 60 * 60 * 1000;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: days.toString().padStart(2, "0"),
        hours: hours.toString().padStart(2, "0"),
        minutes: minutes.toString().padStart(2, "0"),
        seconds: seconds.toString().padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!mounted) {
    return (
      <div className="flash-timer" style={{ display: 'flex', gap: '8px', fontWeight: 'bold', color: '#fff' }}>
        <div style={{ background: '#dc2626', padding: '4px 8px', borderRadius: '4px' }}><span>00</span>d</div>
        <div style={{ background: '#dc2626', padding: '4px 8px', borderRadius: '4px' }}><span>00</span>h</div>
        <div style={{ background: '#dc2626', padding: '4px 8px', borderRadius: '4px' }}><span>00</span>m</div>
        <div style={{ background: '#dc2626', padding: '4px 8px', borderRadius: '4px' }}><span>00</span>s</div>
      </div>
    );
  }

  return (
    <div className="flash-timer" style={{ display: 'flex', gap: '8px', fontWeight: 'bold', color: '#fff' }}>
        <div style={{ background: '#dc2626', padding: '4px 8px', borderRadius: '4px' }}><span>{timeLeft.days}</span>d</div>
        <div style={{ background: '#dc2626', padding: '4px 8px', borderRadius: '4px' }}><span>{timeLeft.hours}</span>h</div>
        <div style={{ background: '#dc2626', padding: '4px 8px', borderRadius: '4px' }}><span>{timeLeft.minutes}</span>m</div>
        <div style={{ background: '#dc2626', padding: '4px 8px', borderRadius: '4px' }}><span>{timeLeft.seconds}</span>s</div>
    </div>
  );
}
