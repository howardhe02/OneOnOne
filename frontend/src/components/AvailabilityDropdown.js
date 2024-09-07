import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import "../static/AvailabilityDropdown.css"
import React, {useState, useEffect} from 'react';

const AvailabilityDropdown= (props) => {
    const{
        setSelectedDay,
        date,
        day,
        month,
        year,
        monthOffset,
        yearOffset,
        time,
        allAvailSlots,
        setAllAvailSlots,
        displayInviteesBool,
        inviteeAvails,
    } = props;

    const [updatedMonth,setUpdatedMonth] = useState(month+monthOffset);
    if (updatedMonth === 13){
        setUpdatedMonth(1);
    }
    if(updatedMonth === 0){
        setUpdatedMonth(12);
    }
    const [availability, setAvailability] = useState("");
    // const id = `${year+yearOffset}-${updatedMonth}-${day}-${time}`;
    
    const slotDate = (new Date(year+yearOffset, updatedMonth-1, day, time, 0, 0).toISOString().slice(0,10));
    const slotStartTime = (new Date(year+yearOffset, updatedMonth-1, day, time-4, 0, 0).toISOString().slice(11,19));
   
    useEffect(() => {
        if (!displayInviteesBool){
            const preferenceStr = ["Low", "Mid", "High"];
            const slotsForDay = allAvailSlots.filter(slot => 
                (slot.date === slotDate && slot.start_time === slotStartTime));
            if(slotsForDay.length > 0){
                setAvailability(preferenceStr[slotsForDay[0].preference_level - 1]);
            }
        }
        
    }, [allAvailSlots, slotDate, slotStartTime])
    

    const addSlot = (preferenceLevel) =>{
        const newSlot = {
            "date": new Date(year+yearOffset, updatedMonth-1, day, time, 0, 0).toISOString().slice(0,10),
            "start_time": new Date(year+yearOffset, updatedMonth-1, day, time-4, 0, 0).toISOString().slice(11,19),
            "end_time": new Date(year+yearOffset, updatedMonth-1, day, time-3, 0, 0).toISOString().slice(11,19),
            "preference_level": preferenceLevel
        }
        setAllAvailSlots(prevSlots => [...prevSlots, newSlot]);
    }
    const removeSlot = () =>{
        setAllAvailSlots(prevSlots => prevSlots.filter(slot => !(slot.date === slotDate && slot.start_time===slotStartTime)));
    }

    const handleSelect = (eventKey) => {
        if (inviteeAvails){
            setAvailability(eventKey);
            setSelectedDay(date);
        }
        else{
            switch (eventKey) {
                case "1":
                    setAvailability("Low");
                    setSelectedDay(date);
                    addSlot(1);
                    break;
                case "2":
                    setAvailability("Mid");
                    setSelectedDay(date);
                    addSlot(2);
                    break;
                case "3":
                    setAvailability("High");
                    setSelectedDay(date);
                    addSlot(3);
                    break;
                default:
                    setAvailability(""); 
                    removeSlot();
                    break;
            }
        }
        
    };

    function inviteeItem(invitee) {
        if (invitee.status) {
        }   
            return <Dropdown.Item eventKey={invitee.contact.first_Name} style={{ fontSize: '12px' }}>{invitee.contact.first_Name} {invitee.contact.last_Name}</Dropdown.Item>


    }
    //console.log("start1");
    //console.log(displayInviteesBool);
    //console.log("end1");
    return (
        <div>
            
        {[DropdownButton].map((DropdownType, idx) => (
          <DropdownType
            className="dropdown"
            as={ButtonGroup}
            key={idx}
            id={`dropdown-button-drop-${idx}`}
            size="sm"
            variant="secondary"
            title={availability}
            onSelect={handleSelect}
          >
            {displayInviteesBool ? (
                <div>
                    <span>
                        {
                            inviteeAvails.map((invitee) => (
                            inviteeItem(invitee)
                            ))
                        }
                    </span>
                </div>
            ) : (
                <div>
                <Dropdown.Item eventKey="0" style={{ fontSize: '12px' }}>Select Availability</Dropdown.Item>
                <Dropdown.Item eventKey="1" style={{ fontSize: '12px' }}>Low Preference</Dropdown.Item>
                <Dropdown.Item eventKey="2" style={{ fontSize: '12px' }}>Mid Preference</Dropdown.Item>
                <Dropdown.Item eventKey="3" style={{ fontSize: '12px' }}>High Preference</Dropdown.Item>
                </div>
            )}
          </DropdownType>
        ))}
      </div>
    );
  }
  
  export default AvailabilityDropdown;