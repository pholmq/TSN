import { useEffect, useRef } from "react";
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
} from "react-icons/fa";

import LevaUI from "./LevaUI";

import { useStore } from "../store";
import {
  posToDate,
  posToTime,
  isValidDate,
  dateTimeToPos,
  dateToDays,
  addYears,
  addMonths,
  timeToPos,
  isValidTime,
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
  } = useStore();

  const dateRef = useRef();
  const timeRef = useRef();
  const intervalRef = useRef();

  useEffect(() => {
    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);

    if (run) {
      intervalRef.current = setInterval(() => {
        if (document.activeElement !== dateRef.current) {
          dateRef.current.value = posToDate(posRef.current);
        }
        if (document.activeElement !== timeRef.current) {
          timeRef.current.value = posToTime(posRef.current);
        }
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
  }, [run]);

  function dateKeyDown(e) {
    //Prevent planet camera from moving
    e.stopPropagation();

    if (e.key !== "Enter") {
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
    updateAC();
    document.activeElement.blur();
  }

  function timeKeyDown(e) {
    e.stopPropagation();
    if (e.key !== "Enter") {
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
    updateAC();
    document.activeElement.blur();
  }

  const handleReset = () => {
    posRef.current = 0;
    dateRef.current.value = posToDate(posRef.current);
    timeRef.current.value = posToTime(posRef.current);
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

  return (
    <>
      <button
        hidden={showMenu}
        className="menu-toggle-button"
        onClick={handleToggleMenu} // Make sure you have this toggle function
        style={{
          position: "fixed",
          top: "14px",
          right: "12px",
          zIndex: 20,
          background: "#374151",
          border: "none",
          borderRadius: "6px",
          padding: "12px",
          color: "white",
          cursor: "pointer",
        }}
      ></button>
      <div className="menu" hidden={runIntro || !showMenu}>
        <div className="menu-item">
          <span className="menu-header"> The TYCHOSIUM</span>
          <button
            className="menu-button menu-header-button"
            title="www.tychos.space"
            onClick={() => window.open("https://www.tychos.space", "_blank")}
          >
            <FaExternalLinkAlt />
          </button>
          {/* <button className="menu-button menu-header-button" onClick={() => {}}>
            <FaShareAlt />
          </button> */}
          {/* <button className="menu-button menu-header-button" onClick={() => {}}>
            <FaGithub />
          </button> */}
          <div className="zoom-controls">
            <UIZoom />
            <button
              className="menu-button menu-header-button"
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
              updateAC();
            }}
          >
            Today
          </button>
          <button
            className="menu-button"
            onClick={() => {
              if (speedFact === sYear) {
                //If it is a year or month, we need some special logic
                //so that we step a calendar year/month
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
                //If it is a year or month, we need some special logic
                //so that we step a calendar year/month
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
            onBlur={() => (dateRef.current.value = posToDate(posRef.current))}
          />
        </div>
        <div className="menu-item">
          <label className="menu-label">Time (UTC):</label>
          <input
            className="menu-input"
            ref={timeRef}
            onKeyDown={timeKeyDown}
            onBlur={() => (timeRef.current.value = posToTime(posRef.current))}
          />
        </div>
        <div className="menu-item">
          <div>
            <LevaUI />
          </div>
        </div>
      </div>
    </>
  );
};

export default UserInterface;
