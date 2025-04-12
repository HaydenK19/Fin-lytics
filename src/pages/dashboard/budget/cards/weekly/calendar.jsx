import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import enUS from "date-fns/locale/en-US";
import CustomToolbar from './customCal';

import "./calendar.scss";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const formats = {
  timeGutterFormat: () => "", // Removes time from the gutter
  eventTimeRangeFormat: () => "", // Removes time from event display
  agendaTimeRangeFormat: () => "", // Removes time from agenda view
};

const CalendarCard = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const fetchedEvents = [
        {
          title: "Groceries",
          category: "Food",
          start: new Date(2025, 4, 6), 
          end: new Date(2025, 4, 6),
          id: 1,
        },
        {
          title: "Payday",
          category: "Income",
          start: new Date(2025, 3, 8),
          end: new Date(2025, 3, 8),
          id: 2,
        },
      ];
      setEvents(fetchedEvents);
    };

    fetchEvents();
  }, []);

  // temp category colors
  const categoryColors = {
    Food: "#FFB6C1", // Light pink
    Income: "#90EE90", // Light green
    Bills: "#ADD8E6", // Light blue
    Other: "#FFD700", // gold
  };

  // Custom event component
  const EventComponent = ({ event }) => {
    const backgroundColor = categoryColors[event.category] || "#D3D3D3"; // Default to light gray
    return (
      <div
        style={{
          backgroundColor,
          color: "#000",
          padding: "5px",
          borderRadius: "5px",
          marginBottom: "5px",
          fontSize: "0.9rem",
        }}
      >
        {event.title}
      </div>
    );
  };

  return (
    <div
      style={{
        fontFamily: "Quicksand",
        height: "40vh",
        padding: "10px",
        backgroundColor: "#fff",
        borderRadius: "10px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={["week", "month"]}
        formats={formats} // Pass the formats object here
        style={{ height: "100%" }}
        showMultiDayTimes={false} // Hides the time slots in the multi-day view
        min={new Date(2025, 3, 6, 8, 0)}
        max={new Date(2025, 3, 6, 16, 0)}
        components={{
          event: EventComponent, // Custom event rendering
          toolbar: CustomToolbar,
        }}
      />
    </div>
  );
};

export default CalendarCard;