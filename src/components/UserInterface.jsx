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
    showLevaMenu,
    toggleShowLevaMenu,
    setResetClicked,
    setCameraTarget,
    runIntro,
    setShowHelp,
  } = useStore();

  const dateRef = useRef();
  const timeRef = useRef();
  const julianRef = useRef();
  const intervalRef = useRef();
  const menuRef = useRef(null);
  const dateTimeDisplayRef = useRef(null);

  const steppingInterval = useRef(null);
  const steppingTimeout = useRef(null);

  // Updated to only show the date
  const updateDateTimeDisplay = () => {
    if (dateTimeDisplayRef.current) {
      dateTimeDisplayRef.current.textContent = posToDate(posRef.current);
    }
  };

  useEffect(() => {
    const handleOutsideTap = (e) => {
      if (e.pointerType !== "touch") return;
      if (showMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        handleToggleBothMenus();
      }
    };

    document.addEventListener("pointerdown", handleOutsideTap);
    return () => document.removeEventListener("pointerdown", handleOutsideTap);
  }, [showMenu]);

  useEffect(() => {
    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);
    julianRef.current.value = posToJulianDay(posRef.current).toFixed(6);
    updateDateTimeDisplay();

    if (run) {
      intervalRef.current = setInterval(() => {
        if (document.activeElement !== dateRef.current) {
          dateRef.current.value = posToDate(posRef.current);
        }
        if (document.activeElement !== timeRef.current) {
          timeRef.current.value = posToTime(posRef.current);
        }
        if (document.activeElement !== julianRef.current) {
          julianRef.current.value = posToJulianDay(posRef.current).toFixed(6);
        }
        updateDateTimeDisplay();
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
    julianRef.current.value = posToJulianDay(posRef.current).toFixed(6);
    updateAC();
    updateDateTimeDisplay();
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
    if (e.key !== "Enter" && e.key !== "Tab") return;
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
    julianRef.current.value = posToJulianDay(posRef.current).toFixed(6);
    updateAC();
    updateDateTimeDisplay();
    if (e.key === "Enter") document.activeElement.blur();
  }

  function timeKeyDown(e) {
    e.stopPropagation();
    if (e.key !== "Enter" && e.key !== "Tab") return;
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
    julianRef.current.value = posToJulianDay(posRef.current).toFixed(6);
    updateAC();
    updateDateTimeDisplay();
    if (e.key === "Enter") document.activeElement.blur();
  }

  function julianKeyDown(e) {
    e.stopPropagation();
    if (e.key !== "Enter" && e.key !== "Tab") return;
    if (!isNumeric(julianRef.current.value)) {
      julianRef.current.value = posToJulianDay(posRef.current).toFixed(6);
      return;
    }
    posRef.current = julianDayTimeToPos(
      julianRef.current.value,
      posToTime(posRef.current)
    );
    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);
    julianRef.current.value = posToJulianDay(posRef.current).toFixed(6);
    updateAC();
    updateDateTimeDisplay();
    if (e.key === "Enter") document.activeElement.blur();
  }

  const handleReset = () => {
    posRef.current = 0;
    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);
    julianRef.current.value = posToJulianDay(posRef.current).toFixed(6);
    updateAC();
    updateDateTimeDisplay();
    setResetClicked();
    setCameraTarget("Earth");
  };

  const handleToggleBothMenus = () => {
    toggleShowMenu();
    toggleShowLevaMenu();
  };

  return createPortal(
    <>
      {!(showMenu || runIntro) && (
        <div
          style={{
            position: "fixed",
            top: "14px",
            right: "12px",
            zIndex: 2147483647,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Floating Date Text */}
          <div
            ref={dateTimeDisplayRef}
            style={{
              color: "#9ca3af",
              fontFamily: "monospace",
              fontSize: "14px",
              fontVariantNumeric: "tabular-nums",
              textShadow: "1px 1px 2px rgba(0,0,0,0.6)",
              pointerEvents: "none",
              marginRight: "4px",
            }}
          >
            {/* Initial render fallback updated to only date */}
            {posToDate(posRef.current)}
          </div>

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

          <button
            className="menu-toggle-button"
            onClick={handleToggleBothMenus}
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
      )}

      <div
        ref={menuRef}
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
              onClick={handleToggleBothMenus}
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
              julianRef.current.value = posToJulianDay(posRef.current).toFixed(
                6
              );
              updateAC();
              updateDateTimeDisplay();
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
              if (!isValidDate(e.target.value))
                dateRef.current.value = posToDate(posRef.current);
              updateDateTimeDisplay();
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
              if (!isValidTime(e.target.value))
                timeRef.current.value = posToTime(posRef.current);
              updateDateTimeDisplay();
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
              if (!isNumeric(e.target.value))
                julianRef.current.value = posToJulianDay(
                  posRef.current
                ).toFixed(6);
              else julianRef.current.value = Number(e.target.value).toFixed(6);
              updateDateTimeDisplay();
            }}
          />
        </div>
        <div className="menu-item" hidden={!showLevaMenu}>
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
