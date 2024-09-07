import React, {useState} from "react";
import "../static/style.css";
import "../static/schedule-invite-timetable.css";
import "../static/schedule-invite.css";
import CalendarWeekView from "./CalendarWeekView";

const Calendar = (props) => {
    const{
        month: initialMonth,
        year: initialYear,
        allAvailSlots,
        setAllAvailSlots,
        displayInviteesBool,
        inviteeAvails,
    }
    = props;
    const [month, setMonth] = useState(initialMonth);
    const [year, setYear] = useState(initialYear);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    const handlePrevClick = () => {
        const newMonth = month === 1 ? 12 : month - 1;
        const newYear = month === 1 ? year - 1 : year;
        setMonth(newMonth);
        setYear(newYear);
    };

    const handleNextClick = () => {
        const newMonth = month === 12 ? 1 : month + 1;
        const newYear = month === 12 ? year + 1 : year;
        setMonth(newMonth);
        setYear(newYear);
    };

    const handleDayClick = (date) => {
        setSelectedDay(date);
        setSelectedMonth(month+date.monthOffset);
    }

    let prevMonth = month-1;
    let prevYear = year;
    // let nextMonth = month+1;
    let nextYear = year;

    if (month === 1){
        prevMonth = 12;
        prevYear = year-1;
    }

    if (month === 12){
        // nextMonth = 1;
        nextYear = year + 1;
    }
    
    // get how many days in previous month
    const prevDaysInMonth = new Date(prevYear, prevMonth, 0).getDate();
    // get weekday of first day in current month
    const currFirstWeekday = new Date(year, month-1, 1).getDay();

    const allDays = [];
    // add the days from the previous month
    for (let i = currFirstWeekday; i > 0; i--){
        allDays.push({day: prevDaysInMonth-i+1, monthOffset: -1, yearOffset: prevYear-year});
    }
    // add the days for the current week 
    let totalDays = new Date(year, month, 0).getDate();
    for (let i = 1; i <=totalDays; i++){
        allDays.push({day: i, monthOffset: 0, yearOffset: 0});
    }
    //add days from upcoming month
    const remainingDays = 42-allDays.length;
    for (let i = 1; i<=remainingDays; i++){
        allDays.push({day: i, monthOffset: 1, yearOffset: nextYear-year})
    }

    function getMonthString(year, month){
        return new Date(year, month-1).toLocaleString('default', { month: 'long' }).toUpperCase();
    }
    
    function getWeekForDay(allDays, date) {
        const {day, monthOffset} = date;
        const dateIndex = allDays.findIndex(date=> date.day === day 
            && date.monthOffset===monthOffset);
        const weekStartIndex = Math.floor(dateIndex / 7) * 7;
        const weekEndIndex = weekStartIndex + 6; 
        return allDays.slice(weekStartIndex, weekEndIndex + 1); 
    }
    //console.log("start2");
    //console.log(displayInviteesBool);
    //console.log("end2");

    return (
        <div id="full-calendar">
        {selectedDay && (<CalendarWeekView 
            date={selectedDay} 
            week={getWeekForDay(allDays, selectedDay)} 
            monthStr={getMonthString(year, selectedMonth).substring(0,3)}
            monthNum={month}
            year={year}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            allAvailSlots={allAvailSlots}
            setAllAvailSlots={setAllAvailSlots}
            displayInviteesBool={displayInviteesBool}
            inviteeAvails={inviteeAvails}/>)}
        {!selectedDay && (
        <div id="availability-calendar">
            <div className="month-year">
                <button className="prev arrow-btn"
                    onClick={handlePrevClick}>&#10094;</button>
                <p>{getMonthString(year, month)} {year}</p>
                <button className="next arrow-btn"
                    onClick={handleNextClick}>&#10095;</button>
            </div>
            
            <div className="datepicker-calendar">
                <p className="day">Su</p>
                <p className="day">Mo</p>
                <p className="day">Tu</p>
                <p className="day">We</p>
                <p className="day">Th</p>
                <p className="day">Fr</p>
                <p className="day">Sa</p>
                {allDays.map((date, index) => (
                <button 
                    key={date + index} 
                    className={`date ${(date.monthOffset!==0) ? 'faded' : ''}`}
                    onClick={() => handleDayClick(date)}>
                {date.day}</button>))}
            </div>
            </div>)}
        </div>
        
    );
};

export default Calendar;