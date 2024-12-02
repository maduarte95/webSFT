import React, { useState, useEffect, useRef } from "react";
import { usePlayer, usePlayers, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
// TODO FIX THE RACE CONDITIONS

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

  const [currentTimestamp, setCurrentTimestamp] = useState(null);

  // Add serverStartTime check
  const serverStartTime = stage.get("serverStartTime");
  if (!serverStartTime) {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    if (isPlayerTurn && inputRef.current) {
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


  // async function getServerTimestamp() {

  //   console.log("Requesting server timestamp for stage", stage.get("name"));
  //   player.set("requestTimestamp", true);
    
  //   // await new Promise(resolve => setTimeout(resolve, 50));
    
  //   // return new Promise((resolve) => {
  //   //   const checkTimestamp = () => {
  //   //     const timestamp = player.stage.get("serverTimestamp");
  //   //     if (timestamp !== undefined) {
  //   //       console.log("Received server timestamp:", timestamp);
  //   //       resolve(timestamp);
  //   //     } else {
  //   //       setTimeout(checkTimestamp, 50);
  //   //     }
  //   //   };
  //   //   checkTimestamp();
  //   // });

  //   // const timestamp = player.stage.get("serverTimestamp");
  //   // console.log("Received server timestamp in getServerTimestamp:", timestamp);
  //   // return timestamp;
  // }

  // async function getServerTimestamp() {
  //   console.log("Requesting server timestamp for stage", stage.get("name"));
    
  //   // Clear existing timestamp
  //   player.stage.set("serverTimestamp", undefined);
    
  //   // Record request time
  //   const requestTime = Date.now();
    
  //   // Set request flag
  //   player.set("requestTimestamp", true);
    
  //   return Promise.race([
  //     new Promise((resolve) => {
  //       const checkTimestamp = () => {
  //         const timestamp = player.stage.get("serverTimestamp");
  //         // Only accept timestamps newer than our request
  //         if (timestamp && timestamp > requestTime) {
  //           resolve(timestamp);
  //         } else {
  //           setTimeout(checkTimestamp, 50);
  //         }
  //       };
  //       checkTimestamp();
  //     }),
  //     new Promise((_, reject) => 
  //       setTimeout(() => reject(new Error("Timestamp request timeout")), 5000)
  //     )
  //   ]).catch(error => {
  //     console.error("Error getting timestamp:", error);
  //     return null;
  //   });
  // }

  // async function handleSendWord() {
  //   if (currentWord.trim() === "" || !isPlayerTurn) return;
  
  //   const clientStartTime = Date.now();
  //   console.log(`Word submission initiated at client time: ${clientStartTime}`);
  //   console.log(`[Player ${player.id}] Current turn: ${round.get("currentTurnPlayerId")}`);

  //   // // Clear own timestamp before getting new one
  //   // player.stage.set("serverTimestamp", undefined);
  //   // console.log(`[Player ${player.id}] Cleared own cached timestamp before request`);

  //   // // const timestamp = await getServerTimestamp();
  //   // await getServerTimestamp();
  //   // console.log("Awaited getServerTimestamp, new flag:", player.get("requestTimestamp"));
    
  //   // // Wait briefly for the timestamp to be updated via the useEffect hook
  //   // await new Promise(resolve => setTimeout(resolve, 100));

  //   // // const timestamp = player.stage.get("serverTimestamp");
  //   // const timestamp = currentTimestamp;
  //   // console.log(`[Player ${player.id}] Received timestamp: ${timestamp}`);
  //   // console.log(`[Player ${player.id}] Previous words:`, round.get("words"));

  //   const timestamp = await getServerTimestamp();
  //   if (!timestamp) {
  //     console.error("Failed to get valid timestamp");
  //     return;
  //   }

  //   const serverStartTime = stage.get("startTime") || stage.get("serverStartTime");
  //   const clientEndTime = Date.now();

  //   console.log(`Word submission details:
  //     Word: ${currentWord.trim()}
  //     Request start time: ${clientStartTime}
  //     Request end time: ${clientEndTime}
  //     Request duration: ${clientEndTime - clientStartTime}ms
  //     Server timestamp: ${timestamp}
  //     Server start time: ${serverStartTime}
  //     Elapsed time since stage start: ${timestamp - serverStartTime}ms`);

  //   if (serverStartTime && timestamp) {
  //     const relativeTimestamp = timestamp - serverStartTime;
  //     const words = round.get("words") || [];
  //     const updatedWords = [...words, { 
  //       text: currentWord.trim(), 
  //       player: player.id, 
  //       timestamp: relativeTimestamp 
  //     }];
  //     round.set("words", updatedWords);
  //     setCurrentWord("");
    
  //     // Switch turns
  //     round.set("currentTurnPlayerId", otherPlayer.id);

  //     console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
  //   } else {
  //     console.error("Invalid timestamp or start time", { timestamp, serverStartTime }); 
  //   }
  // }

  //stripped down code

  async function getServerTimestamp() {
    console.log("Requesting server timestamp for stage", stage.get("name"));
    
    // Clear existing timestamp
    await player.stage.set("serverTimestamp", undefined);
    console.log(`[Player ${player.id}] Cleared existing timestamp`);
    
    // Set request flag
    await player.set("requestTimestamp", true);
    console.log(`[Player ${player.id}] Set request flag`);
  
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 10;
      
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
 
  //with extra logging 
  // async function handleSendWord() {
  //   // if (currentWord.trim() === "" || !isPlayerTurn) return;

  //   // Get the current state BEFORE we start
  //   const currentTurn = round.get("currentTurnPlayerId");
  //   const currentWords = round.get("words") || []; //for what?

  //   //add lock
  //   const [isSubmitting, setIsSubmitting] = useState(false);

  //     // Verify it's still our turn
  //   if (currentTurn !== player.id) return;

  //   console.log('handleSendWord called:', {
  //     currentWord,
  //     isPlayerTurn,
  //     currentTurnPlayerId: round.get("currentTurnPlayerId"),
  //     myId: player.id,
  //     timestamp: Date.now()
  //   });

  //   if (currentWord.trim() === "" || isSubmitting || !isPlayerTurn) {
  //     console.log('handleSendWord rejected:', {
  //       emptyWord: currentWord.trim() === "",
  //       isPlayerTurn,
  //       currentTurnPlayerId: round.get("currentTurnPlayerId")
  //     });
  //     return;
  //   }
  
  //   try {
  //     // console.log(`[Player ${player.id}] Starting word submission`);
  //     setIsSubmitting(true);
  //     console.log(`[Player ${player.id}] Starting word submission:`, {
  //       currentTurnPlayerId: round.get("currentTurnPlayerId"),
  //       isPlayerTurn,
  //       timestamp: Date.now()
  //     });

  //     const timestamp = await getServerTimestamp();

  //     // Re-verify turn hasn't changed during timestamp request
  //     if (round.get("currentTurnPlayerId") !== currentTurn) return;

  //     // Log after getting timestamp, before updating words
  //     console.log(`[Player ${player.id}] Got timestamp, updating words:`, {
  //       currentTurnPlayerId: round.get("currentTurnPlayerId"),
  //       isPlayerTurn,
  //       timestamp: Date.now()
  //     });
      
  //     if (!timestamp) {
  //       throw new Error("No timestamp received");
  //     }
  
  //     console.log(`[Player ${player.id}] Got timestamp: ${timestamp}`);
      
  //     const serverStartTime = stage.get("serverStartTime");
  //     if (!serverStartTime) {
  //       throw new Error("No server start time available");
  //     }
  
  //     const relativeTimestamp = timestamp - serverStartTime;
  //     if (relativeTimestamp < 0) {
  //       throw new Error(`Invalid relative timestamp: ${relativeTimestamp}`);
  //     }
  
  //     // Only proceed if we have valid timestamps
  //     const words = round.get("words") || [];
  //     const updatedWords = [...words, { 
  //       text: currentWord.trim(), 
  //       player: player.id, 
  //       timestamp: relativeTimestamp 
  //     }];
  
  //     await round.set("words", updatedWords);
  //     setCurrentWord("");

  //     // Log before changing turn
  //     console.log(`[Player ${player.id}] Changing turn:`, {
  //       fromPlayer: player.id,
  //       toPlayer: otherPlayer.id,
  //       currentTurnPlayerId: round.get("currentTurnPlayerId"),
  //       timestamp: Date.now()
  //     });

  //     round.set("currentTurnPlayerId", otherPlayer.id);

  //     // Log after changing turn
  //     console.log(`[Player ${player.id}] Turn changed:`, {
  //       newTurnPlayerId: round.get("currentTurnPlayerId"),
  //       wordCount: updatedWords.length,
  //       timestamp: Date.now()
  //     });
  //     //end of new logs
      
  //     console.log(`[Player ${player.id}] Word submission complete:`, {
  //       word: currentWord.trim(),
  //       timestamp,
  //       serverStartTime,
  //       relativeTimestamp
  //     });
  //     console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
  //   } catch (error) {
  //     console.error(`[Player ${player.id}] Word submission failed:`, error);
  //   }
  // }

  //issue - multiple successive turns are happening
  async function handleSendWord() {
    if (currentWord.trim() === "" || !isPlayerTurn) return;
  
    try {
      console.log(`[Player ${player.id}] Starting word submission`);
      const timestamp = await getServerTimestamp();
      
      if (!timestamp) {
        throw new Error("No timestamp received");
      }
  
      console.log(`[Player ${player.id}] Got timestamp: ${timestamp}`);
      
      const serverStartTime = stage.get("serverStartTime");
      if (!serverStartTime) {
        throw new Error("No server start time available");
      }
  
      const relativeTimestamp = timestamp - serverStartTime;
      if (relativeTimestamp < 0) {
        throw new Error(`Invalid relative timestamp: ${relativeTimestamp}`);
      }
  
      // Only proceed if we have valid timestamps
      const words = round.get("words") || [];
      const updatedWords = [...words, { 
        text: currentWord.trim(), 
        player: player.id, 
        timestamp: relativeTimestamp 
      }];
  
      await round.set("words", updatedWords);
      setCurrentWord("");
      round.set("currentTurnPlayerId", otherPlayer.id);
      
      console.log(`[Player ${player.id}] Word submission complete:`, {
        word: currentWord.trim(),
        timestamp,
        serverStartTime,
        relativeTimestamp
      });
      console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
    } catch (error) {
      console.error(`[Player ${player.id}] Word submission failed:`, error);
    }
  }


  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSendWord();
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
            ref = {inputRef}
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter an item..."
            className="flex-grow p-2 border border-gray-300 rounded mr-2"
            disabled={!isPlayerTurn}
            autoFocus={isPlayerTurn}
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