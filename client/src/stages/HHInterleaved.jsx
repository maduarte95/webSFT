import React, { useState, useEffect } from "react";
import { usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function HHInterleaved() {
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const otherPlayer = players.find(p => p.id !== player.id);
  const isPlayerTurn = round.get("currentTurnPlayerId") === player.id;

  useEffect(() => {
    const words = round.get("words") || [];
    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      const wordOwner = lastSavedWord.player === player.id ? "You" : "Partner";
      setLastWord(`${wordOwner}: ${lastSavedWord.text}`);
    }
  }, [round.get("words"), player.id]);

  function handleSendWord() {
    if (currentWord.trim() === "" || !isPlayerTurn) return;

    const words = round.get("words") || [];
    const updatedWords = [...words, { text: currentWord.trim(), player: player.id }];
    round.set("words", updatedWords);
    round.set("score", updatedWords.length);
    setCurrentWord("");

    // Switch turns
    round.set("currentTurnPlayerId", otherPlayer.id);
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
            placeholder="Enter an animal name..."
            className="flex-grow p-2 border border-gray-300 rounded mr-2"
            disabled={!isPlayerTurn}
          />
          <Button 
            handleClick={handleSendWord} 
            disabled={!isPlayerTurn || currentWord.trim() === ""}
          >
            Send
          </Button>
        </div>
        {isPlayerTurn ? (
          <p className="mt-2 text-green-600">It's your turn!</p>
        ) : (
          <p className="mt-2 text-gray-600">Waiting for your partner...</p>
        )}
      </div>
    </div>
  );
}
