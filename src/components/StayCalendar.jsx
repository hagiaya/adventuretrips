import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, getDay, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';

const StayCalendar = ({ schedules, selectedDate, onSelect, rooms = 1, nightDuration = 1, defaultPrice = 0 }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (selectedDate) {
            const date = typeof selectedDate === 'string' ? parseISO(selectedDate) : selectedDate;
            if (!isSameMonth(date, currentMonth)) {
                setCurrentMonth(date);
            }
        }
    }, [selectedDate]);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDayOfWeek = getDay(monthStart);
    const paddingDays = Array(startDayOfWeek).fill(null);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-fadeIn">
            <div className="bg-white p-4 flex items-center justify-between border-b border-gray-50">
                <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                    <ChevronLeft size={20} />
                </button>
                <h3 className="font-bold text-gray-900 capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
                </h3>
                <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="grid grid-cols-7 text-center border-b border-gray-50 bg-gray-50/30">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                    <div key={i} className="py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr bg-gray-50 gap-px">
                {paddingDays.map((_, i) => (
                    <div key={`pad-${i}`} className="bg-white h-20 md:h-24"></div>
                ))}

                {daysInMonth.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const safeSchedules = Array.isArray(schedules) ? schedules : [];
                    const hasSchedules = safeSchedules.length > 0;
                    const schedule = safeSchedules.find(s => s.date === dateStr);

                    const remaining = schedule ? (parseInt(schedule.quota) - (parseInt(schedule.booked) || 0)) : 0;
                    // If schedules exist, strictly follow them. If not, open availability.
                    const isAvailable = hasSchedules ? (schedule && remaining >= rooms) : true;
                    const isSelected = selectedDate === dateStr;
                    const isToday = isSameDay(day, new Date());
                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                    // Disable past dates always
                    const isClickable = isAvailable && !isPast;

                    // Check if day is within stay range
                    let isInRange = false;
                    if (selectedDate) {
                        const start = parseISO(selectedDate);
                        const end = addDays(start, nightDuration - 1);
                        if (day >= start && day <= end) isInRange = true;
                    }

                    let containerClass = "bg-white h-20 md:h-24 p-1.5 flex flex-col items-center justify-start relative transition-all group overflow-hidden";
                    if (isClickable) containerClass += " cursor-pointer hover:bg-primary/5";
                    else if (hasSchedules && !isAvailable && !isPast) containerClass += " bg-red-50/30 cursor-not-allowed"; // Full schedule
                    else if (isPast) containerClass += " opacity-40 cursor-not-allowed"; // Past date
                    else containerClass += " cursor-pointer hover:bg-primary/5"; // Implicit available

                    let dateClass = "w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all z-10";
                    if (isSelected) dateClass += " bg-primary text-white shadow-lg shadow-pink-200 scale-110";
                    else if (isToday) dateClass += " border border-primary text-primary";
                    else if (isInRange) dateClass += " bg-primary/10 text-primary";
                    else if (isClickable) dateClass += " text-gray-700 bg-gray-50 group-hover:bg-primary/20";
                    else dateClass += " text-gray-300";

                    return (
                        <div
                            key={i}
                            onClick={() => isClickable && onSelect(dateStr)}
                            className={containerClass}
                        >
                            {isInRange && !isSelected && <div className="absolute inset-0 bg-primary/5 z-0"></div>}
                            <span className={dateClass}>{format(day, 'd')}</span>

                            {schedule ? (
                                <div className="mt-auto w-full text-center pb-1 z-10">
                                    {isAvailable ? (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-primary">
                                                Rp {(parseInt(schedule.price) / 1000).toLocaleString()}k
                                            </span>
                                            <span className="text-[8px] text-gray-400 font-medium">Sisa {remaining}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Lock size={10} className="text-red-300 mb-0.5" />
                                            <span className="text-[8px] font-bold text-red-400 uppercase">Penuh</span>
                                        </div>
                                    )}
                                </div>
                            ) : !isPast && (
                                <div className="mt-auto pb-2 z-10 w-full text-center">
                                    {hasSchedules ? (
                                        <span className="text-[8px] text-gray-300 italic">No Data</span>
                                    ) : (
                                        <div className="flex flex-col">
                                            {defaultPrice > 0 && (
                                                <span className="text-[10px] font-black text-primary">
                                                    Rp {(defaultPrice / 1000).toLocaleString()}k
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StayCalendar;
