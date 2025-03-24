// import { usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
// import React from "react";
// import { Button } from "../components/Button";
// import { useEffect, useState } from "react";

// export function Result() {
//   const player = usePlayer();
//   const players = usePlayers();
//   const round = useRound();

//   // Add state to store words
//   const [words, setWords] = useState([]);
//   const [score, setScore] = useState(0);

//   // Load data in useEffect, similar to SwitchesId
//   useEffect(() => {
//     const wordsData = player.round.get("words") || [];
//     const scoreData = player.round.get("score") || 0;
    
//     setWords(wordsData);
//     setScore(scoreData);
    
//     // Debug
//     console.log("Result component loading words:", wordsData);
//   }, [player.round]);

//   const roundName = round.get("name");

//   // Determine if this is an interleaved round
//   const isInterleaved = roundName?.includes("Interleaved");

//   // For multiplayer rounds, determine which words are the player's
//   const getWordOwner = (word) => {
//     // Case 1: Interleaved rounds
//     if (isInterleaved) {
//       // AI Interleaved case - check source
//       if (word.source === "user" || word.source === "ai") {
//         return word.source === "user";
//       }
//       // Human-Human Interleaved case - check player ID
//       return word.player === player.id;
//     }
    
//     // Case 2: Human-Human collaboration (using main/helper roles)
//     if (players.length > 1 && (word.source === "main" || word.source === "helper")) {
//       return word.source === (player.get("role") === "main" ? "main" : "helper");
//     }
    
//     // Case 3: AI collaboration (using user/ai source)
//     return word.source === "user";
//   };

//   const handleContinue = () => {
//     player.stage.set("submit", true);
//   };

//   return (
//     <div className="grid grid-rows-[auto_60vh_auto_auto] max-w-4xl mx-auto px-4 py-8 gap-y-6 h-screen">
//       <h1 className="text-4xl font-bold text-center">Round Summary</h1>
      
//       <div className="bg-white rounded-lg shadow-lg border border-gray-200 relative">
//         {/* Debug info */}
//         <div className="absolute top-0 left-0 right-0 text-sm text-gray-500 bg-white p-2 z-10 border-b">
//           Number of words: {words.length}
//         </div>
        
//         <div 
//           className="overflow-y-auto p-6 pt-10" 
//           style={{ height: "100%" }}
//         >
//           {words.map((word, index) => {
//             const isYourWord = getWordOwner(word);
//             return (
//               <div
//                 key={index}
//                 className={`p-2 mb-3 rounded-md text-lg ${
//                   isYourWord
//                     ? "text-slate-600 bg-slate-50"
//                     : "text-slate-800 bg-slate-100"
//                 }`}
//               >
//                 <span className="font-semibold mr-2">{index + 1}.</span>
//                 <span className="font-medium">{isYourWord ? "You" : "Partner"}:</span> {word.text}
//                 {/* {index === words.length - 1 && (
//                   <span className="ml-2 text-xs bg-yellow-100 px-2 py-1 rounded">Last word</span>
//                 )} */}
//               </div>
//             );
//           })}
          
//           <div className="h-8"></div>
//         </div>
//       </div>
      
//       <div className="bg-gray-50 rounded-lg p-6 w-full max-w-md mx-auto">
//         <div className="text-center">
//           <div className="mb-3">
//             <span className="text-lg font-semibold">Total Words: </span>
//             <span className="text-2xl text-gray-700">{words.length}</span>
//           </div>
//           <div className="mb-3">
//             <span className="text-lg font-semibold">Round Score: </span>
//             <span className="text-2xl text-gray-700">{score}</span>
//           </div>
//         </div>
//       </div>
      
//       <div className="flex justify-center">
//         <Button handleClick={handleContinue}>
//           Continue
//         </Button>
//       </div>
//     </div>
//   );

// }


import { usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import React from "react";
import { Button } from "../components/Button";
import { useEffect, useState } from "react";

export function Result() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();

  // Add state to store words and feedback
  const [words, setWords] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState({});
  const [validationError, setValidationError] = useState(false);

  // Load data in useEffect, similar to SwitchesId
  useEffect(() => {
    const wordsData = player.round.get("words") || [];
    const scoreData = player.round.get("score") || 0;
    // Get any existing feedback
    const existingFeedback = player.round.get("wordFeedback") || {};
    
    setWords(wordsData);
    setScore(scoreData);
    setFeedback(existingFeedback);
    
    // Debug
    console.log("Result component loading words:", wordsData);
  }, [player.round]);

  const roundName = round.get("name");

  // Determine if this is an interleaved round
  const isInterleaved = roundName?.includes("Interleaved");

  // For multiplayer rounds, determine which words are the player's
  const getWordOwner = (word) => {
    // Case 1: Interleaved rounds
    if (isInterleaved) {
      // AI Interleaved case - check source
      if (word.source === "user" || word.source === "ai") {
        return word.source === "user";
      }
      // Human-Human Interleaved case - check player ID
      return word.player === player.id;
    }
    
    // Case 2: Human-Human collaboration (using main/helper roles)
    if (players.length > 1 && (word.source === "main" || word.source === "helper")) {
      return word.source === (player.get("role") === "main" ? "main" : "helper");
    }
    
    // Case 3: AI collaboration (using user/ai source)
    return word.source === "user";
  };

  // Get all partner words
  const partnerWords = words.filter(word => !getWordOwner(word));
  
  // Check if all partner words have feedback
  const allFeedbackGiven = partnerWords.every((word, idx) => {
    const wordIndex = words.indexOf(word);
    return feedback[wordIndex] === 1 || feedback[wordIndex] === -1;
  });

  const handleFeedback = (index, isPositive) => {
    // Create a new feedback object with the updated value
    const newFeedback = {
      ...feedback,
      [index]: isPositive ? 1 : -1
    };
    
    // Update state
    setFeedback(newFeedback);
    setValidationError(false);
    
    console.log(`Feedback for word ${index}: ${isPositive ? "👍" : "👎"}`);
  };

  const handleContinue = () => {
    // Check if all partner words have feedback
    if (!allFeedbackGiven) {
      setValidationError(true);
      return;
    }
    
    // Convert feedback object to array of objects like in SwitchesId
    const feedbackArray = words.map((word, index) => {
      const isYourWord = getWordOwner(word);
      return {
        index: index,
        word: word.text,
        // For the player's own words, we set feedback to 0 (neutral)
        // For partner words, we use the recorded feedback or 0 if none
        feedback: isYourWord ? 0 : (feedback[index] || 0)
      };
    });
    
    // Save to player's round data
    player.set("wordFeedback", feedbackArray);
    
    console.log("Saving feedback:", feedbackArray);
    player.stage.set("submit", true);
  };

  return (
    
    <div className="grid grid-rows-[auto_auto_60vh_auto_auto] max-w-4xl mx-auto px-4 py-8 gap-y-6 h-screen">
      <h1 className="text-4xl font-bold text-center">Round Summary</h1>

      <div className="bg-gray-50 p-4 rounded-lg mb-2 text-center mx-auto">
        <p className="text-gray-700 leading-relaxed">
          Please rate each of your partner's contributions with a thumbs up 👍 if you found them helpful or thumbs down 👎 if unhelpful.
          All partner words highlighted in yellow require feedback before you can continue.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 relative">
        {/* Debug info */}
        <div className="absolute top-0 left-0 right-0 text-sm text-gray-500 bg-white p-2 z-10 border-b">
          Number of words: {words.length} | Feedback needed: {partnerWords.length}
        </div>
        
        <div 
          className="overflow-y-auto p-6 pt-10" 
          style={{ height: "100%" }}
        >
          {words.map((word, index) => {
            const isYourWord = getWordOwner(word);
            const needsFeedback = !isYourWord && (feedback[index] !== 1 && feedback[index] !== -1);
            
            return (
              <div
                key={index}
                className={`p-2 mb-3 rounded-md text-lg flex justify-between items-center ${
                  isYourWord
                    ? "text-slate-600 bg-slate-50"
                    : needsFeedback
                      ? "text-slate-800 bg-yellow-50 border border-yellow-200"
                      : "text-slate-800 bg-slate-100"
                }`}
              >
                <div>
                  <span className="font-semibold mr-2">{index + 1}.</span>
                  <span className="font-medium">{isYourWord ? "You" : "Partner"}:</span> {word.text}
                </div>
                
                {/* Only show feedback buttons for partner's words */}
                {!isYourWord && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleFeedback(index, true)}
                      className={`p-2 rounded-full transition-colors ${
                        feedback[index] === 1 
                          ? "bg-green-100 text-green-600" 
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                      aria-label="Thumbs up"
                    >
                      👍
                    </button>
                    <button 
                      onClick={() => handleFeedback(index, false)}
                      className={`p-2 rounded-full transition-colors ${
                        feedback[index] === -1 
                          ? "bg-red-100 text-red-600" 
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      }`}
                      aria-label="Thumbs down"
                    >
                      👎
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="h-8"></div>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 w-full max-w-md mx-auto">
        <div className="text-center">
          <div className="mb-3">
            <span className="text-lg font-semibold">Total Words: </span>
            <span className="text-2xl text-gray-700">{words.length}</span>
          </div>
          <div className="mb-3">
            <span className="text-lg font-semibold">Round Score: </span>
            <span className="text-2xl text-gray-700">{score}</span>
          </div>
          
          {validationError && (
            <div className="text-red-500 font-medium mb-3">
              Please rate all partner words before continuing.
            </div>
          )}
          
          {!allFeedbackGiven && !validationError && (
            <div className="text-yellow-600 font-medium mb-3">
              Please provide feedback for all highlighted partner words.
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button 
          handleClick={handleContinue}
          className={!allFeedbackGiven ? "opacity-70" : ""}
        >
          Continue {partnerWords.length > 0 ? `(${Object.keys(feedback).length}/${partnerWords.length})` : ""}
        </Button>
      </div>
    </div>
  );
}