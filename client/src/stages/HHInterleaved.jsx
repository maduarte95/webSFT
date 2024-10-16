import React, { useState, useEffect } from "react";
import { usePlayer, usePlayers, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function HHInterleaved() {
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const otherPlayer = players.find(p => p.id !== player.id);
  const isPlayerTurn = round.get("currentTurnPlayerId") === player.id;
  const stage = useStage();

  useEffect(() => {
    const words = round.get("words") || [];
    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      const wordOwner = lastSavedWord.player === player.id ? "You" : "Partner";
      setLastWord(`${wordOwner}: ${lastSavedWord.text}`);
    }
    player.round.set("score", words.length); //set both players' score to total word count  
  }, [round.get("words"), player.id]); 


  async function getServerTimestamp() {
    console.log("Requesting server timestamp");
    player.set("requestTimestamp", true);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return new Promise((resolve) => {
      const checkTimestamp = () => {
        const timestamp = player.get("serverTimestamp");
        if (timestamp !== undefined) {
          console.log("Received server timestamp:", timestamp);
          resolve(timestamp);
        } else {
          setTimeout(checkTimestamp, 50);
        }
      };
      checkTimestamp();
    });
  }

  async function handleSendWord() {
    if (currentWord.trim() === "" || !isPlayerTurn) return;
  
    const clientStartTime = Date.now();
    console.log(`Word submission initiated at client time: ${clientStartTime}`);

    const timestamp = await getServerTimestamp();
    const serverStartTime = stage.get("startTime") || stage.get("serverStartTime");
    const clientEndTime = Date.now();

    console.log(`Word submission details:
      Word: ${currentWord.trim()}
      Request start time: ${clientStartTime}
      Request end time: ${clientEndTime}
      Request duration: ${clientEndTime - clientStartTime}ms
      Server timestamp: ${timestamp}
      Server start time: ${serverStartTime}
      Elapsed time since stage start: ${timestamp - serverStartTime}ms`);

    if (serverStartTime && timestamp) {
      const relativeTimestamp = timestamp - serverStartTime;
      const words = round.get("words") || [];
      const updatedWords = [...words, { 
        text: currentWord.trim(), 
        player: player.id, 
        timestamp: relativeTimestamp 
      }];
      round.set("words", updatedWords);
      setCurrentWord("");
    
      // Switch turns
      round.set("currentTurnPlayerId", otherPlayer.id);

      console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
    } else {
      console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
    }
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