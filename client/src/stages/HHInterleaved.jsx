import React, { useState, useEffect, useRef } from "react";
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
  const category = player.round.get("category");
  player.round.set("roundName", "InterleavedHH");
  const inputRef = useRef(null);
  const isSubmittingRef = useRef(false);

  const [currentTimestamp, setCurrentTimestamp] = useState(null);

  // Add serverStartTime check
  const serverStartTime = stage.get("serverStartTime");
  if (!serverStartTime) {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    if (isPlayerTurn && inputRef.current && !isSubmittingRef.current) {
      inputRef.current.focus();
    }
  }, [isPlayerTurn]);

  //logging - Track component lifecycle
  useEffect(() => {
    console.log('HHInterleaved mounted:', {
      currentTurnPlayerId: round.get("currentTurnPlayerId"),
      myId: player.id,
      words: round.get("words"),
      timestamp: Date.now()
    });
  }, []);
    
  // logging - Track changes to currentTurnPlayerId
  useEffect(() => {
    console.log(`[Player ${player.id}] Turn state changed:`, {
      currentTurnPlayerId: round.get("currentTurnPlayerId"),
      isPlayerTurn: round.get("currentTurnPlayerId") === player.id,
      wordCount: (round.get("words") || []).length,
      timestamp: Date.now()
    });
  }, [round.get("currentTurnPlayerId")]);
  

  useEffect(() => {
    const words = round.get("words") || [];
    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      const wordOwner = lastSavedWord.player === player.id ? "You" : "Partner";
      setLastWord(`${wordOwner}: ${lastSavedWord.text}`);
    }
    player.round.set("score", words.length); //set both players' score to total word count  
  }, [round.get("words"), player.id]); 

  useEffect(() => {
    const timestamp = player.stage.get("serverTimestamp");
    console.log(`[Player ${player.id}] Timestamp changed:`, timestamp);
    // if (timestamp) {
    //   setCurrentTimestamp(timestamp);
    // }
  }, [player.stage.get("serverTimestamp")]);


  async function getServerTimestamp() {
    console.log(`[Player ${player.id}] Requesting server timestamp for stage ${stage.get("name")}`);
    
    // Clear existing timestamp
    await player.stage.set("serverTimestamp", undefined);
    console.log(`[Player ${player.id}] Cleared existing timestamp`);
    
    // Set request flag
    await player.set("requestTimestamp", true);
    console.log(`[Player ${player.id}] Set request flag`);
  
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;
      
      const checkTimestamp = () => {
        attempts++;
        const timestamp = player.stage.get("serverTimestamp");
        console.log(`[Player ${player.id}] Check attempt ${attempts}: timestamp=${timestamp}`);
        
        if (timestamp) {
          resolve(timestamp);
        } else if (attempts >= maxAttempts) {
          reject(new Error(`Failed to get timestamp after ${maxAttempts} attempts`));
        } else {
          setTimeout(checkTimestamp, 100);
        }
      };
      
      checkTimestamp();
    });
  }


  async function handleSendWord() {
    // Initial validation with refs for synchronous checks
    if (currentWord.trim() === "" || !isPlayerTurn || isSubmittingRef.current) {
      return;
    }
    
    // Immediately lock submissions and capture word
    isSubmittingRef.current = true;
    const wordToSubmit = currentWord.trim();
    setCurrentWord(""); // Clear input immediately
  
    try {
      // Check for duplicates before proceeding
      const words = round.get("words") || [];
      const isDuplicate = words.some(w => 
        w.text.toLowerCase() === wordToSubmit.toLowerCase() &&
        w.player === player.id
      );
  
      if (isDuplicate) {
        console.log(`[Player ${player.id}] Duplicate word rejected: ${wordToSubmit}`);
        setLastWord(`"${wordToSubmit}" was already used!`);
        return;
      }
  
      console.log(`[Player ${player.id}] Starting word submission`);
  
      const timestamp = await getServerTimestamp();
      if (!timestamp) {
        throw new Error("No timestamp received");
      }
  
      console.log(`[Player ${player.id}] Got timestamp: ${timestamp}`);
      
      if (!serverStartTime) {
        throw new Error("No server start time available");
      }
  
      const relativeTimestamp = timestamp - serverStartTime;
      if (relativeTimestamp < 0) {
        throw new Error(`Invalid relative timestamp: ${relativeTimestamp}`);
      }
  
      // Verify it's still our turn before submitting
      if (round.get("currentTurnPlayerId") !== player.id) {
        throw new Error("Turn changed during submission");
      }

      // Check for slow response
      if (words.length > 0) {
        const lastWord = words[words.length - 1];
        const responseDelay = relativeTimestamp - lastWord.timestamp;
        if (responseDelay > 10000) { // 10 seconds in milliseconds
          const currentPenalties = player.get("slowResponsePenalties") || 0;
          player.set("slowResponsePenalties", currentPenalties + 1);
          console.log(`Slow response penalty applied: ${responseDelay}ms`);
        }
      }
  
      const updatedWords = [...words, {
        text: wordToSubmit,
        player: player.id,
        timestamp: relativeTimestamp
      }];
  
      // Atomic updates - update words and change turn together
      await Promise.all([
        round.set("words", updatedWords),
        round.set("currentTurnPlayerId", otherPlayer.id)
      ]);
  
      console.log(`[Player ${player.id}] Word submission complete:`, {
        word: wordToSubmit,
        timestamp,
        relativeTimestamp,
        newTurn: otherPlayer.id
      });
  
    } catch (error) {
      console.error(`[Player ${player.id}] Word submission failed:`, error);
      // On error, restore the word to input if it wasn't a duplicate
      if (wordToSubmit && !words?.some(w => w.text.toLowerCase() === wordToSubmit.toLowerCase())) {
        setCurrentWord(wordToSubmit);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-8">Name as many items as you can: {category}</h2>
      
      <div className="mt-8 text-4xl font-bold mb-8">
        {lastWord || "No words yet"}
      </div>
      
      <div className="w-full max-w-md">
        <div className="flex items-center mb-4">
          <input
            ref={inputRef}
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.repeat) {
                e.preventDefault();
                handleSendWord();
              }
            }}
            placeholder="Enter an item..."
            className={`flex-grow p-2 border rounded mr-2 ${
              !isPlayerTurn || isSubmittingRef.current
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-300'
            }`}
            disabled={!isPlayerTurn || isSubmittingRef.current}
            autoFocus
          />
          <Button 
            handleClick={handleSendWord} 
            disabled={
              !isPlayerTurn || 
              isSubmittingRef.current || 
              currentWord.trim() === ""
            }
          >
            Send
          </Button>
        </div>
  
        {/* Status Messages */}
        {isSubmittingRef.current ? (
          <p className="mt-2 text-gray-600">Submitting...</p>
        ) : isPlayerTurn ? (
          <p className="mt-2 text-green-600">It's your turn!</p>
        ) : (
          <p className="mt-2 text-gray-600">Waiting for your partner...</p>
        )}
      </div>
    </div>
  );
}


