import React, {useState, useEffect} from 'react';

const MeetingCell = (props) => {
    const{
        day,
        month,
        year,
        monthOffset,
        yearOffset,
        time,
        allMeetings
    } = props;

    const [updatedMonth,setUpdatedMonth] = useState(month+monthOffset);
    if (updatedMonth === 13){
        setUpdatedMonth(1);
    }
    if(updatedMonth === 0){
        setUpdatedMonth(12);
    }
    const [display, setDisplay] = useState("");
    
    const cellStartTime = (new Date(year+yearOffset, updatedMonth-1, day, time-4, 0, 0).toISOString().slice(0,19));
    const cellEndTime = (new Date(year+yearOffset, updatedMonth-1, day, time-3, 0, 0).toISOString().slice(0,19));

    useEffect(() => {
        const meetingsForDay = allMeetings.filter(meeting => 
            (meeting.start_time === cellStartTime && meeting.end_time === cellEndTime));
        if(meetingsForDay.length > 0){
            setDisplay(meetingsForDay[0].first_name + " " + meetingsForDay[0].last_name);
        }
    }, [allMeetings, cellStartTime, cellEndTime])
    
    return (
        <div className="display-name">
        {display}
      </div>
    );
  }
  
  export default MeetingCell;