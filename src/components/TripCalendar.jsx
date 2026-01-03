import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, getDay, addDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TripCalendar = ({ schedules, selectedIndex, onSelect, duration }) => {
    // Determine initial month based on selected schedule or first available
    // Default to current date if no valid schedules
    const initialDate = schedules && schedules[selectedIndex]
        ? parseISO(schedules[selectedIndex].date)
        : (schedules && schedules.length > 0 ? parseISO(schedules[0].date) : new Date());

    const [currentMonth, setCurrentMonth] = useState(initialDate);

    // Update current month if selectedIndex changes significantly (e.g. externally set)
    useEffect(() => {
        if (schedules && schedules[selectedIndex]) {
            const date = parseISO(schedules[selectedIndex].date);
            if (!isSameMonth(date, currentMonth)) {
                setCurrentMonth(date);
            }
        }
    }, [selectedIndex, schedules]);

    // Generate days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Padding for start of week (Sunday start)
    const startDayOfWeek = getDay(monthStart); // 0 = Sun
    const paddingDays = Array(startDayOfWeek).fill(null);

    const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

    if (!schedules || schedules.length === 0) {
        return (
            <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                Belum ada jadwal tersedia.
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-fadeIn">
            {/* Calendar Header */}
            <div className="bg-white p-4 flex items-center justify-between border-b border-gray-100">
                <button
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                >
                    <ChevronLeft size={20} />
                </button>
                <h3 className="font-bold text-gray-900 text-sm md:text-base capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
                </h3>
                <button
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center border-b border-gray-100 bg-gray-50/50">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                    <div key={i} className="py-2.5 text-xs font-bold text-gray-400">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr bg-gray-100 gap-px border-b border-gray-100">
                {paddingDays.map((_, i) => (
                    <div key={`pad-${i}`} className="bg-white h-20 md:h-24"></div>
                ))}

                {daysInMonth.map((day, i) => {
                    // Check if this day has a schedule
                    const scheduleIdx = schedules.findIndex(s => isSameDay(parseISO(s.date), day));
                    const schedule = scheduleIdx >= 0 ? schedules[scheduleIdx] : null;

                    const remaining = schedule ? (parseInt(schedule.quota) - (parseInt(schedule.booked) || 0)) : 0;
                    const isAvailable = schedule && remaining > 0;
                    const isLowQuota = remaining <= 5;
                    const isSelected = selectedIndex === scheduleIdx;
                    const isToday = isSameDay(day, new Date());

                    let containerClass = "bg-white h-20 md:h-24 p-1 flex flex-col items-center justify-start cursor-default relative group transition-all";
                    let dateClass = "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1";

                    // Determine if day is in active range (highlighted)
                    let rangeHighlightClass = "";
                    let isRangeStart = false;
                    let isRangeEnd = false;
                    let isRangeMiddle = false;

                    // Logic to calculate range for selected schedule
                    if (schedules && selectedIndex >= 0 && schedules[selectedIndex]) {
                        const startDate = parseISO(schedules[selectedIndex].date);

                        // Parse Duration using refined regex logic
                        let durationDays = 1;
                        if (duration) {
                            // Match "3 Days", "3 Hari", "3D" or just number
                            const match = duration.toString().match(/(\d+)/);
                            if (match) {
                                durationDays = parseInt(match[0]);
                            }
                        }

                        if (durationDays > 1) {
                            const endDate = addDays(startDate, durationDays - 1);

                            // Check if day is within range
                            if (day >= startDate && day <= endDate) {
                                if (isSameDay(day, startDate)) isRangeStart = true;
                                else if (isSameDay(day, endDate)) isRangeEnd = true;
                                else isRangeMiddle = true;
                            }
                        }
                    }

                    if (isSelected || isRangeStart) {
                        // START OF RANGE
                        containerClass += " !bg-emerald-600 z-20 shadow-md scale-[1.02] rounded-l-lg rounded-r-none";
                        dateClass += " bg-white text-emerald-600 font-bold";
                    } else if (isRangeMiddle) {
                        // MIDDLE OF RANGE
                        containerClass += " !bg-emerald-600/90 z-10 rounded-none";
                        dateClass += " text-white font-bold";
                    } else if (isRangeEnd) {
                        // END OF RANGE
                        containerClass += " !bg-emerald-600/90 z-10 rounded-r-lg";
                        dateClass += " text-white font-bold";
                    } else if (schedule) {
                        // Other available dates that are NOT part of the selected range
                        if (isAvailable) {
                            if (isLowQuota) {
                                containerClass += " hover:bg-yellow-50 cursor-pointer";
                                dateClass += " text-gray-700 bg-yellow-100 group-hover:bg-yellow-200 text-yellow-700";
                            } else {
                                containerClass += " hover:bg-green-50 cursor-pointer";
                                dateClass += " text-gray-700 bg-green-100 group-hover:bg-green-200 text-green-700";
                            }
                        } else {
                            containerClass += " bg-gray-50/50 cursor-not-allowed";
                            dateClass += " text-gray-300 bg-gray-100 line-through";
                        }
                    } else {
                        // Empty days
                        dateClass += " text-gray-300";
                    }

                    if (isToday && !isSelected && !isRangeStart && !isRangeMiddle && !isRangeEnd) {
                        dateClass += " border border-primary text-primary";
                    }

                    return (
                        <div
                            key={i}
                            onClick={() => schedule && isAvailable && onSelect(scheduleIdx)}
                            className={containerClass}
                        >
                            <span className={dateClass}>{format(day, 'd')}</span>

                            {schedule ? (
                                <div className="text-center w-full mt-1 flex flex-col gap-0.5">
                                    {isAvailable ? (
                                        <>
                                            <span className={`text-[9px] font-bold ${isLowQuota ? (isSelected || isRangeStart ? 'text-yellow-700' : 'text-yellow-600') : (isSelected || isRangeStart ? 'text-green-700' : 'text-green-600')}`}>
                                                {isLowQuota ? 'Hampir Habis' : 'Tersedia'}
                                            </span>
                                            <span className={`text-[9px] ${isSelected || isRangeStart ? 'text-gray-700' : 'text-gray-400'}`}>
                                                Sisa {remaining}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[10px] font-bold text-red-500 bg-red-100 px-1 rounded">FULL</span>
                                    )}
                                </div>
                            ) : null}

                            {(isRangeMiddle || isRangeEnd) && !schedule && (
                                <div className="absolute bottom-1 w-full text-center">
                                    <div className="h-1 bg-green-200 mx-auto w-1/2 rounded-full"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Legend */}
            <div className="p-3 bg-white flex gap-4 justify-center text-[10px] text-gray-500 flex-wrap">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Tersedia
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Sisa ≤ 5
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Penuh
                </div>
            </div>
        </div>
    );
};

export default TripCalendar;
