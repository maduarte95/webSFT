// import { usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
// import React from "react";
// import { Button } from "../components/Button";

// export function Result() {
//   const player = usePlayer();
//   const players = usePlayers();
//   const round = useRound();
//   const words = round.get("words") || [];
//   const score = player.round.get("score") || 0;

//   // Determine if this is a single-player (AI) or multi-player round
//   const isMultiPlayer = players.length > 1;

//   // For multiplayer rounds, determine which words are the player's
//   const getWordOwner = (word) => {
//     if (isMultiPlayer) {
//       return word.source === (player.get("role") === "main" ? "main" : "helper");
//     }
//     return word.source === "user";
//   };

//   const handleContinue = () => {
//     player.stage.set("submit", true);
//   };

//   return (
//     <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-4">
//       <h1 className="text-4xl font-bold mb-8">Round Summary</h1>

//       <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden mb-8">
//         <div className="max-h-96 overflow-y-auto p-6">
//           {words.map((word, index) => (
//             <div
//               key={index}
//               className={`mb-2 text-lg ${
//                 getWordOwner(word)
//                   ? "text-emerald-600"
//                   : "text-blue-600"
//               }`}
//             >
//               {index + 1}. {getWordOwner(word) ? "You" : "Partner"}: {word.text}
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="bg-gray-50 rounded-lg p-6 mb-8 w-full max-w-md">
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

//       <Button handleClick={handleContinue} className="mt-4">
//         Continue
//       </Button>
//     </div>
//   );
// }


// import { usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
// import React from "react";
// import { Button } from "../components/Button";

// export function Result() {
//   const player = usePlayer();
//   const players = usePlayers();
//   const round = useRound();
//   const words = player.round.get("words") || [];
//   const score = player.round.get("score") || 0;
//   const roundName = round.get("name");

//   // Determine if this is an interleaved round
//   const isInterleaved = roundName?.includes("Interleaved");

//   // For multiplayer rounds, determine which words are the player's
//   const getWordOwner = (word) => {
//     // Case 1: Interleaved rounds (using player IDs)
//     if (isInterleaved) {
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
//     <div className="flex flex-col h-full max-w-4xl mx-auto px-4 py-8">
//       <h1 className="text-4xl font-bold mb-8 text-center">Round Summary</h1>

//       <div className="flex-1 min-h-0 w-full bg-white rounded-lg shadow-lg overflow-hidden mb-8">
//         <div className="h-full max-h-[calc(100vh-24rem)] overflow-y-auto p-6">
//           {words.map((word, index) => (
//             <div
//               key={index}
//               className={`mb-2 text-lg ${
//                 getWordOwner(word)
//                   ? "text-emerald-600"
//                   : "text-blue-600"
//               }`}
//             >
//               {index + 1}. {getWordOwner(word) ? "You" : "Partner"}: {word.text}
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="bg-gray-50 rounded-lg p-6 mb-8 w-full max-w-md mx-auto">
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

export function Result() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const words = player.round.get("words") || [];
  const score = player.round.get("score") || 0;
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

  const handleContinue = () => {
    player.stage.set("submit", true);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Round Summary</h1>

      <div className="flex-1 w-full bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="h-[60vh] overflow-y-auto p-6">
          {words.map((word, index) => (
            <div
              key={index}
              className={`mb-2 text-lg ${
                getWordOwner(word)
                  ? "text-emerald-600"
                  : "text-blue-600"
              }`}
            >
              {index + 1}. {getWordOwner(word) ? "You" : "Partner"}: {word.text}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-8 w-full max-w-md mx-auto">
        <div className="text-center">
          <div className="mb-3">
            <span className="text-lg font-semibold">Total Words: </span>
            <span className="text-2xl text-gray-700">{words.length}</span>
          </div>
          <div className="mb-3">
            <span className="text-lg font-semibold">Round Score: </span>
            <span className="text-2xl text-gray-700">{score}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button handleClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}