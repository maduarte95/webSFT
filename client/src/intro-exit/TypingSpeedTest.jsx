import React, { useState, useEffect } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";
const TIME_LIMIT = 15; // time limit

export function TypingSpeedTest({ next }) {
  const [inputText, setInputText] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const player = usePlayer();

  useEffect(() => {
    if (inputText.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
  }, [inputText, startTime]);

  useEffect(() => {
    if (startTime && !isFinished) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = TIME_LIMIT - elapsed;
        setTimeLeft(remaining >= 0 ? remaining : 0);

        if (remaining <= 0) {
          clearInterval(timer);
          setIsFinished(true);
          calculateSpeed();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [startTime, isFinished]);

  const handleInputChange = (e) => {
    if (!isFinished) {
      setInputText(e.target.value);
      if (e.target.value === SAMPLE_TEXT) {
        setEndTime(Date.now());
        setIsFinished(true);
        calculateSpeed();
      }
    }
  };

  const calculateSpeed = () => {
    const timeInSeconds = Math.min((endTime || Date.now()) - startTime, TIME_LIMIT * 1000) / 1000;
    const wordsTyped = SAMPLE_TEXT.split(" ").length;
    const charactersTyped = SAMPLE_TEXT.length;

    const wpm = Math.round((wordsTyped / timeInSeconds) * 60);
    const cpm = Math.round((charactersTyped / timeInSeconds) * 60);

    player.set("typingSpeedWPM", wpm);
    player.set("typingSpeedCPM", cpm);
  };

  const handleContinue = () => {
    const wpm = player.get("typingSpeedWPM");
    if (wpm && wpm >= 30) { // Set your desired WPM threshold here
      next();
    } else {
      player.set("failed_typing_test", true);
      // Redirect to Prolific's completion URL
      alert("Thank you for your participation. Unfortunately, you do not meet the typing speed requirement for this study.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-8">Typing Speed Test</h2>
      <p className="mb-4 text-xl">{SAMPLE_TEXT}</p>
      <p className="mb-4">Time left: {timeLeft} seconds</p>
      <textarea
        value={inputText}
        onChange={handleInputChange}
        className="w-full max-w-lg p-2 border border-gray-300 rounded mb-4"
        rows={3}
        disabled={isFinished}
        placeholder="Start typing here..."
      />
      {isFinished && (
        <div className="mb-4">
          <p>Your typing speed:</p>
          <p>{player.get("typingSpeedWPM")} WPM</p>
          <p>{player.get("typingSpeedCPM")} CPM</p>
        </div>
      )}
      {isFinished && (
        <Button handleClick={handleContinue}>Continue</Button>
      )}
    </div>
  );
}

//TODO: Add enter button + accuracy?
//TODO: Add time taken + save to player 
//TODO: Add explainer text
//TODO: replace red text with Alert component