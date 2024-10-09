import React, { useState, useEffect } from "react";
import { usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function HHCollab() {
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const player = usePlayer();
  const players = usePlayers();
  const partner = players.find(p => p.id !== player.id);
  const isMain = player.get("role") === "main";
  const round = useRound();

  useEffect(() => {
    const words = round.get("words") || [];
    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      setLastWord(lastSavedWord.source === 'helper' ? `Assistant: ${lastSavedWord.text}` : lastSavedWord.text);
    }
  }, [round.get("words")]);

  function handleSendWord() {
    if (currentWord.trim() === "" || (isMain && round.get("waitingForAssistant"))) return;

    const words = round.get("words") || [];
    const updatedWords = [...words, { text: currentWord.trim(), source: isMain ? 'main' : 'helper' }];
    round.set("words", updatedWords);
    setCurrentWord("");

    if (!isMain) {
      round.set("waitingForAssistant", false);
    }

    const mainWordCount = updatedWords.filter(word => word.source === 'main').length;
    round.set("score", mainWordCount);
  }

  function handleRequestHint() {
    round.set("waitingForAssistant", true);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSendWord();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-8">Collaborative Animal Naming</h2>
      <div className="mt-8 text-4xl font-bold mb-8">
        {lastWord || "No words yet"}
      </div>
      <div className="w-full max-w-md">
        <div className="flex items-center mb-4">
          <input
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isMain ? "Enter an animal name..." : "Enter your hint..."}
            className="flex-grow p-2 border border-gray-300 rounded mr-2"
            disabled={(isMain && round.get("waitingForAssistant")) || (!isMain && !round.get("waitingForAssistant"))}
          />
          <Button 
            handleClick={handleSendWord} 
            disabled={(isMain && round.get("waitingForAssistant")) || (!isMain && !round.get("waitingForAssistant")) || currentWord.trim() === ""}
          >
            Send
          </Button>
        </div>
        {isMain && (
          <Button 
            handleClick={handleRequestHint} 
            disabled={round.get("waitingForAssistant")}
          >
            Request Hint
          </Button>
        )}
        {round.get("waitingForAssistant") && isMain && <p className="mt-2 text-gray-600">Waiting for assistant's hint...</p>}
        {!isMain && round.get("waitingForAssistant") && <p className="mt-2 text-gray-600">The main player needs your help! Please provide a hint.</p>}
        {!isMain && !round.get("waitingForAssistant") && <p className="mt-2 text-gray-600">Waiting for the main player to request assistance...</p>}
      </div>
    </div>
  );
}