import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaBars,
  FaTimes,
  FaQuestionCircle,
} from "react-icons/fa";

import LevaUI from "./LevaUI";

import { useStore } from "../store";
import {
  posToDate,
  posToTime,
  posToJulianDay,
  isValidDate,
  dateTimeToPos,
  julianDayTimeToPos,
  dateToDays,
  addYears,
  addMonths,
  timeToPos,
  isValidTime,
  isNumeric,
  sDay,
  sMonth,
  sYear,
} from "../utils/time-date-functions";
import UIZoom from "./UIZoom";

import TychosLogoIcon from "../utils/TychosLogoIcon";

const UserInterface = () => {
  const {
    run,
    toggleRun,
    updateAC,
    posRef,
    speedFact,
    speedMultiplier,
    showMenu,
    toggleShowMenu,
    setResetClicked,
    setCameraTarget,
    runIntro,
    setShowHelp,
  } = useStore();

  const dateRef = useRef();
  const timeRef = useRef();
  const julianRef = useRef();
  const intervalRef = useRef();

  // Refs for stepping logic
  const steppingInterval = useRef(null);
  const steppingTimeout = useRef(null);

  useEffect(() => {
    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);
    julianRef.current.value = posToJulianDay(posRef.current);

    if (run) {
      intervalRef.current = setInterval(() => {
        if (document.activeElement !== dateRef.current) {
          dateRef.current.value = posToDate(posRef.current);
        }
        if (document.activeElement !== timeRef.current) {
          timeRef.current.value = posToTime(posRef.current);
        }
        if (document.activeElement !== julianRef.current) {
          julianRef.current.value = posToJulianDay(posRef.current);
        }
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
  }, [run]);

  useEffect(() => {
    return () => stopStepping();
  }, []);

  const performStep = (direction) => {
    if (speedFact === sYear) {
      posRef.current =
        dateToDays(
          addYears(dateRef.current.value, speedMultiplier * direction)
        ) *
          sDay +
        timeToPos(timeRef.current.value);
    } else if (speedFact === sMonth) {
      posRef.current =
        dateToDays(
          addMonths(dateRef.current.value, speedMultiplier * direction)
        ) *
          sDay +
        timeToPos(timeRef.current.value);
    } else {
      posRef.current += speedFact * speedMultiplier * direction;
    }

    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);
    julianRef.current.value = posToJulianDay(posRef.current);
    updateAC();
  };

  const startStepping = (direction) => {
    performStep(direction);

    if (steppingTimeout.current) clearTimeout(steppingTimeout.current);
    if (steppingInterval.current) clearInterval(steppingInterval.current);

    steppingTimeout.current = setTimeout(() => {
      steppingInterval.current = setInterval(() => {
        performStep(direction);
      }, 100);
    }, 500);
  };

  const stopStepping = () => {
    if (steppingTimeout.current) {
      clearTimeout(steppingTimeout.current);
      steppingTimeout.current = null;
    }
    if (steppingInterval.current) {
      clearInterval(steppingInterval.current);
      steppingInterval.current = null;
    }
  };

  function dateKeyDown(e) {
    e.stopPropagation();

    if (e.key !== "Enter" && e.key !== "Tab") {
      return;
    }

    if (!isValidDate(dateRef.current.value)) {
      dateRef.current.value = posToDate(posRef.current);
      return;
    }

    posRef.current = dateTimeToPos(
      dateRef.current.value,
      posToTime(posRef.current)
    );
    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);
    julianRef.current.value = posToJulianDay(posRef.current);
    updateAC();

    if (e.key === "Enter") {
      document.activeElement.blur();
    }
  }

  function timeKeyDown(e) {
    e.stopPropagation();

    if (e.key !== "Enter" && e.key !== "Tab") {
      return;
    }

    if (!isValidTime(timeRef.current.value)) {
      timeRef.current.value = posToTime(posRef.current);
      return;
    }

    posRef.current = dateTimeToPos(
      posToDate(posRef.current),
      timeRef.current.value
    );
    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);
    julianRef.current.value = posToJulianDay(posRef.current);
    updateAC();

    if (e.key === "Enter") {
      document.activeElement.blur();
    }
  }

  function julianKeyDown(e) {
    e.stopPropagation();

    if (e.key !== "Enter" && e.key !== "Tab") {
      return;
    }

    if (!isNumeric(julianRef.current.value)) {
      julianRef.current.value = posToJulianDay(posRef.current);
      return;
    }

    posRef.current = julianDayTimeToPos(
      julianRef.current.value,
      posToTime(posRef.current)
    );
    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);
    julianRef.current.value = posToJulianDay(posRef.current);
    updateAC();

    if (e.key === "Enter") {
      document.activeElement.blur();
    }
  }

  const handleReset = () => {
    posRef.current = 0;
    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);
    julianRef.current.value = posToJulianDay(posRef.current);
    updateAC();
    setResetClicked();
    setCameraTarget("Earth");
  };

  return createPortal(
    <>
      {/* Container for the floating buttons when the menu is hidden */}
      <div
        hidden={showMenu}
        style={{
          position: "fixed",
          top: "14px",
          right: "12px",
          zIndex: 2147483647,
          display: "flex",
          flexDirection: "row", // Changed to row to place them side-by-side
          gap: "8px",
        }}
      >
        {/* Floating Play/Pause Button (Placed first to be on the left) */}
        <button
          className="menu-toggle-button"
          onClick={toggleRun}
          style={{
            background: "#374151",
            border: "none",
            borderRadius: "6px",
            width: "24px",
            height: "24px",
            padding: "0",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={run ? "Pause" : "Play"}
        >
          {run ? <FaPause size={10} /> : <FaPlay size={10} />}
        </button>

        {/* Toggle Menu Button */}
        <button
          className="menu-toggle-button"
          onClick={toggleShowMenu}
          style={{
            background: "#374151",
            border: "none",
            borderRadius: "6px",
            width: "24px",
            height: "24px",
            padding: "0",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Open Menu"
        >
          <FaBars size={10} />
        </button>
      </div>

      <div
        className="menu"
        hidden={runIntro || !showMenu}
        style={{ zIndex: 2147483647 }}
      >
        <div className="menu-item">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <TychosLogoIcon size={25} />
            <span className="menu-header">The Tychosium</span>
          </div>
          <button
            className="menu-button menu-header-button"
            title="Help"
            onClick={() => setShowHelp(true)}
            style={{ marginRight: "0.25rem", marginLeft: "0.5rem" }}
          >
            <FaQuestionCircle />
          </button>

          <div className="zoom-controls">
            <UIZoom />
            <button
              className="menu-button menu-header-button"
              title="Close Menu"
              onClick={toggleShowMenu}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="menu-item">
          <button className="menu-button" onClick={handleReset}>
            Reset
          </button>
          <button
            className="menu-button"
            onClick={() => {
              const todayPos =
                sDay *
                dateToDays(
                  new Intl.DateTimeFormat("sv-SE", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  }).format(Date.now())
                );
              posRef.current = todayPos;
              dateRef.current.value = posToDate(posRef.current);
              timeRef.current.value = posToTime(posRef.current);
              julianRef.current.value = posToJulianDay(posRef.current);
              updateAC();
            }}
          >
            Today
          </button>

          <button
            className="menu-button"
            onMouseDown={() => startStepping(-1)}
            onMouseUp={stopStepping}
            onMouseLeave={stopStepping}
          >
            <FaStepBackward />
          </button>

          <button className="menu-button" onClick={toggleRun}>
            {run ? <FaPause /> : <FaPlay />}
          </button>

          <button
            className="menu-button"
            onMouseDown={() => startStepping(1)}
            onMouseUp={stopStepping}
            onMouseLeave={stopStepping}
          >
            <FaStepForward />
          </button>
        </div>
        <div className="menu-item">
          <label className="menu-label">Date:</label>
          <input
            className="menu-input"
            ref={dateRef}
            onKeyDown={dateKeyDown}
            onBlur={(e) => {
              if (!isValidDate(e.target.value)) {
                dateRef.current.value = posToDate(posRef.current);
              }
            }}
          />
        </div>
        <div className="menu-item">
          <label className="menu-label">Time (UTC):</label>
          <input
            className="menu-input"
            ref={timeRef}
            onKeyDown={timeKeyDown}
            onBlur={(e) => {
              if (!isValidTime(e.target.value)) {
                timeRef.current.value = posToTime(posRef.current);
              }
            }}
          />
        </div>
        <div className="menu-item">
          <label className="menu-label">Julian day:</label>
          <input
            className="menu-input"
            ref={julianRef}
            onKeyDown={julianKeyDown}
            onBlur={(e) => {
              if (!isNumeric(e.target.value)) {
                julianRef.current.value = posToJulianDay(posRef.current);
              }
            }}
          />
        </div>
        <div className="menu-item">
          <div className="leva-container">
            <LevaUI />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default UserInterface;
