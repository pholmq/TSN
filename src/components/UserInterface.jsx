import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FaPlay,
  FaPause,
  FaStepBackward,
  FaStepForward,
  FaBars,
  FaTimes,
  FaShareAlt,
  FaExternalLinkAlt,
  FaGithub,
  FaInfoCircle,
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

const UserInterface = () => {
  const {
    run,
    toggleRun,
    updateAC,
    posRef,
    speedFact,
    speedMultiplier,
    showLevaMenu,
    toggleShowLevaMenu,
    showMenu,
    toggleShowMenu,
    setResetClicked,
    setCameraTarget,
    runIntro,
    setRunIntro,
    showHelp,
    setShowHelp,
  } = useStore();

  const dateRef = useRef();
  const timeRef = useRef();
  const julianRef = useRef();
  const intervalRef = useRef();

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

  function dateKeyDown(e) {
    // Prevent planet camera from moving
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
    // For Tab key, let the default behavior occur (moving focus to next element)
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
    // For Tab key, let the default behavior occur
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
    // For Tab key, let the default behavior occur
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

  const handleToggleMenu = () => {
    if (showLevaMenu) {
      toggleShowLevaMenu();
      return;
    }
    if (showMenu) {
      toggleShowMenu();
      return;
    }
    toggleShowLevaMenu();
    toggleShowMenu();
  };

  return createPortal(
    <>
      <button
        hidden={showMenu}
        className="menu-toggle-button"
        onClick={handleToggleMenu}
        style={{
          position: "fixed",
          top: "14px",
          right: "12px",
          zIndex: 2147483647,
          background: "#374151",
          border: "none",
          borderRadius: "6px",
          padding: "12px",
          color: "white",
          cursor: "pointer",
        }}
      ></button>
      <div
        className="menu"
        hidden={runIntro || !showMenu}
        style={{ zIndex: 2147483647 }}
      >
        <div className="menu-item">
          <span className="menu-header"> The TYCHOSIUM</span>
          <button
            className="menu-button menu-header-button"
            title="Help"
            onClick={() => setShowHelp(true)}
            style={{ marginRight: "0.25rem", marginLeft: "0.5rem" }} // Add spacing
          >
            <FaInfoCircle />
          </button>

          <div className="zoom-controls">
            <UIZoom />
            <button
              className="menu-button menu-header-button"
              title="Hide/Show Menu"
              onClick={handleToggleMenu}
            >
              {showLevaMenu ? <FaBars /> : <FaTimes />}
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
            onClick={() => {
              if (speedFact === sYear) {
                posRef.current =
                  dateToDays(
                    addYears(dateRef.current.value, -speedMultiplier)
                  ) *
                    sDay +
                  timeToPos(timeRef.current.value);
              } else {
                if (speedFact === sMonth) {
                  posRef.current =
                    dateToDays(
                      addMonths(dateRef.current.value, -speedMultiplier)
                    ) *
                      sDay +
                    timeToPos(timeRef.current.value);
                } else {
                  posRef.current -= speedFact * speedMultiplier;
                }
              }

              dateRef.current.value = posToDate(posRef.current);
              timeRef.current.value = posToTime(posRef.current);
              julianRef.current.value = posToJulianDay(posRef.current);
              updateAC();
            }}
          >
            <FaStepBackward />
          </button>
          <button className="menu-button" onClick={toggleRun}>
            {run ? <FaPause /> : <FaPlay />}
          </button>
          <button
            className="menu-button"
            onClick={() => {
              if (speedFact === sYear) {
                posRef.current =
                  dateToDays(addYears(dateRef.current.value, speedMultiplier)) *
                    sDay +
                  timeToPos(timeRef.current.value);
              } else {
                if (speedFact === sMonth) {
                  posRef.current =
                    dateToDays(
                      addMonths(dateRef.current.value, speedMultiplier)
                    ) *
                      sDay +
                    timeToPos(timeRef.current.value);
                } else {
                  posRef.current += speedFact * speedMultiplier;
                }
              }
              dateRef.current.value = posToDate(posRef.current);
              timeRef.current.value = posToTime(posRef.current);
              julianRef.current.value = posToJulianDay(posRef.current);
              updateAC();
            }}
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
          <div>
            <LevaUI />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default UserInterface;
