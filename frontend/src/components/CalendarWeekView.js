import React from "react";
import "../static/style.css";
import "../static/schedule-invite-timetable.css";
import "../static/schedule-invite.css";
import "../static/WeekView.css";
import AvailabilityDropdown from "./AvailabilityDropdown";

const CalendarWeekView = (props) => {
    const{
        // date,
        week,
        monthStr,
        monthNum,
        year,
        selectedDay,
        setSelectedDay,
        allAvailSlots,
        setAllAvailSlots,
        displayInviteesBool,
        inviteeAvails,
    }
    = props;
    
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    const weekList = [];
    for (let i = 0; i < week.length; i++){
        if (week[i].day === selectedDay.day){
            weekList.push({
                date: week[i],
                day: week[i].day, 
                selected: true, 
                monthOffset: week[i].monthOffset,
                yearOffset: week[i].yearOffset});
        } else{
            weekList.push({
                date: week[i],
                day: week[i].day, 
                selected: false, 
                monthOffset: week[i].monthOffset,
                yearOffset: week[i].yearOffset});
        }
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div id="timetable-calendar">
            <div className="datepicker-calendar timetable">
                <table>
                    <thead className="btn-header">
                    <tr className="exit "> 
                    <td>
                    
                    <button className="btn back" onClick={()=>setSelectedDay(null)}>
                        <p className="back-btn">&#10094;   {monthStr}</p> </button>
                    </td>
                    </tr></thead>
                    <tbody>
                    {hours.map((hour,index) => (
                        <tr key = {"hour-column" + hour + index}>
                            <td className="time dropdown">{hour}:00</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                    {weekList.map((day, index) => (
                    <table key ={"day-column" + day + index}>
                        <thead>
                        <tr                         
                            className="date-header">
                            <td>
                            <div className={`date-btn day day-header ${day.selected ? 'selected': ''}`}>
                            {weekDays[index]}
                            <p className="header-day">{day.day}</p>
                            </div></td>
                        </tr>
                        </thead>
                        <tbody>
                        {hours.map((hour, index) => (
                            <tr key = {"day-cell" + day + hour + index} >
                                <td className="dropdown menus">
                                    <AvailabilityDropdown 
                                    setSelectedDay={setSelectedDay}
                                    allAvailSlots={allAvailSlots}
                                    setAllAvailSlots={setAllAvailSlots}
                                    date={day.date}
                                    day={day.day}
                                    year={year}
                                    month={monthNum}
                                    monthOffset={day.monthOffset}
                                    yearOffset={day.yearOffset}
                                    time={hour}
                                    displayInviteesBool={displayInviteesBool}
                                    inviteeAvails={inviteeAvails}/>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ))}                    
            </div>
        </div>
    );
};

export default CalendarWeekView;