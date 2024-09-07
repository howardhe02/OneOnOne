import React, { useState, useRef } from "react";

function FillAvailability({ submitAvailability }) {
    const [slots, setSlots] = useState([]);
    const startRef = useRef();
    const endRef = useRef();
    const preferenceRef = useRef();

    function saveSlot(e) {
        e.preventDefault();
        const slot = {
            "start_time": startRef.current.value.replace("T", " ").replace(/\-/g, "/").concat(":00"),
            "end_time": endRef.current.value.replace("T", " ").replace(/\-/g, "/").concat(":00"),
            "preference_level": Number(preferenceRef.current.value)
        }
        setSlots([...slots, slot])
    }

    function deleteSlot(index) {
        const newSlots = slots.filter((slot, i) => i !== index);
        setSlots(newSlots);
    }

    return (
        <>
            <h1>Add Availability</h1>
            <form onSubmit={saveSlot}>
                <label >Start Time</label>
                <input type="datetime-local"
                    name="start"
                    ref={startRef} />
                <label >End Time</label>
                <input type="datetime-local"
                    name="end"
                    ref={endRef} />
                <select name="Preference" ref={preferenceRef}>
                    <option value="3">High Preference</option>
                    <option value="2">Medium Preference</option>
                    <option value="1">Low Preference</option>
                </select>
                <button type="submit">Add Availability</button>
            </form>
            <table>
                <thead>
                    <tr>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Preference</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {slots.map((slot, index) => {
                        return (
                            <tr id={index}>
                                <td>{slot["start_time"]}</td>
                                <td>{slot["end_time"]}</td>
                                <td>{slot["preference_level"]}</td>
                                <td><button onClick={() => {
                                    deleteSlot(index)
                                }}>Remove</button></td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
            <button onClick={() => submitAvailability(slots)}>Submit Availability</button>
        </>
    )
};

export default FillAvailability;