import React, { useState, useEffect } from "react";
import { usePlayer, usePlayers } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function HHCollab() {
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [isWaitingForAssistant, setIsWaitingForAssistant] = useState(false);
  const player = usePlayer();
  const players = usePlayers();
  const partner = players.find(p => p.id !== player.id);
  const isMain = player.get("role") === "main";

  useEffect(() => {
    const savedWords = player.round.get("words") || [];
    setWords(savedWords);
  }, [player.round]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const newWords = player.round.get("words") || [];
      if (newWords.length > words.length) {
        setWords(newWords);
        setIsWaitingForAssistant(false);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [player.round, words]);

  function handleSendWord() {
    if (currentWord.trim() === "" || isWaitingForAssistant) return;

    const updatedWords = [...words, { text: currentWord.trim(), source: isMain ? 'main' : 'helper' }];
    setWords(updatedWords);
    player.round.set("words", updatedWords);
    player.round.set("lastWord", currentWord.trim());
    setCurrentWord("");

    if (isMain) {
      setIsWaitingForAssistant(true);
      player.round.set("waitingForAssistant", true);
    } else {
      player.round.set("waitingForAssistant", false);
    }

    const userWordCount = updatedWords.filter(word => word.source === 'main').length;
    player.round.set("score", userWordCount);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSendWord();
    }
  }

  if (!isMain && !player.round.get("waitingForAssistant")) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-3xl font-bold mb-8">Waiting for the main player...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-8">Collaborative Animal Naming</h2>
      <div className="w-full max-w-md">
        <ul className="mb-4 h-60 overflow-y-auto border border-gray-300 rounded p-2">
          {words.map((word, index) => (
            <li key={index} className={`text-xl ${word.source === 'main' ? 'text-blue-600' : 'text-green-600'}`}>
              {word.source === 'main' ? 'Main: ' : 'Helper: '}{word.text}
            </li>
          ))}
        </ul>
        <div className="flex items-center">
          <input
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isMain ? "Enter an animal name..." : "It's your turn: enter an animal name"}
            className="flex-grow p-2 border border-gray-300 rounded mr-2"
            disabled={isMain ? isWaitingForAssistant : !player.round.get("waitingForAssistant")}
          />
          <Button 
            handleClick={handleSendWord} 
            disabled={isMain ? isWaitingForAssistant : !player.round.get("waitingForAssistant") || currentWord.trim() === ""}
          >
            Send
          </Button>
        </div>
        {isWaitingForAssistant && <p className="mt-2 text-gray-600">Waiting for assistant's response...</p>}
      </div>
    </div>
  );
}