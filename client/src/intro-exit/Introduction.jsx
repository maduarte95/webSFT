import React from "react";
import { Button } from "../components/Button";

export function Introduction({ next }) {

  return (
    <div className="mt-3 sm:mt-5 p-20">
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Instructions
      </h3>
      <div className="mt-2 mb-6">
        <p className="text-sm text-gray-500">
        In this experiment, you will be asked to name items in collaboration with a human or AI partner.
        <br />
        The time limit is <strong>3 minutes</strong>. You will be asked to:
        </p>
        <p>
        (a) name as many items as you can think of belonging the given category
        </p>
        <p>
        (b) request words from your partner OR provide words to your partner by pressing a "hint" button
        </p>
      </div>
      <Button handleClick={next} autoFocus>
        <p>Next</p>
      </Button>
    </div>
  );
}

// import React from "react";
// import { Button } from "../components/Button";
// import { useGame } from "@empirica/core/player/classic/react";

// export function Introduction({ next }) {
//   const game = useGame();
//   const treatment = game.get("treatment");
//   const taskType = treatment.taskType;
//   console.log("TaskType", taskType);

//   const renderInstructions = () => {
//     if (taskType === "interleaved") {
//       return (
//         <>
//           <p>
//             In this experiment, you will alternate turns with a partner (human or AI) to name items in a given category.
//           </p>
//           <p>
//             (a) When it's your turn, name an item belonging to the given category.
//           </p>
//           <p>
//             (b) Wait for your partner to provide their answer before your next turn.
//           </p>
//         </>
//       );
//     } else if (taskType === "selfinitiated") {
//       return (
//         <>
//           <p>
//             In this experiment, you will name items in a given category and can request help from a partner (human or AI) when needed.
//           </p>
//           <p>
//             (a) Name as many items as you can think of belonging to the given category.
//           </p>
//           <p>
//             (b) If you need help, you can request a hint from your partner by pressing the "Hint" button.
//           </p>
//         </>
//       );
//     }
//   };

//   return (
//     <div className="mt-3 sm:mt-5 p-20">
//       <h3 className="text-lg leading-6 font-medium text-gray-900">
//         Instructions
//       </h3>
//       <div className="mt-2 mb-6">
//         <p className="text-sm text-gray-500">
//           In this experiment, you will be asked to name items in collaboration with a human or AI partner.
//           <br />
//           The time limit is <strong>3 minutes</strong> for each task.
//         </p>
//         {renderInstructions()}
//         <p className="mt-4">
//           Your goal is to name as many unique items as possible within the time limit.
//         </p>
//       </div>
//       <Button handleClick={next} autoFocus>
//         <p>Next</p>
//       </Button>
//     </div>
//   );
// }