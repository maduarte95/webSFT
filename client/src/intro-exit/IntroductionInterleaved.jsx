// import React from "react";
// import { Button } from "../components/Button";

// export function IntroductionInterleaved({ next }) {
//   return (
//     <div className="mt-3 sm:mt-5 p-20">
//       <h3 className="text-lg leading-6 font-medium text-gray-900">
//         Instructions for Interleaved Task
//       </h3>
//       <div className="mt-2 mb-6">
//         <p className="text-sm text-gray-500">
//           In this experiment, you will alternate turns with a partner (human or AI) to name items in a given category.
//           <br />
//           The time limit is <strong>3 minutes</strong> for each task.
//         </p>
//         <p>
//           (a) When it's your turn, name an item belonging to the given category.
//         </p>
//         <p>
//           (b) Wait for your partner to provide their answer before your next turn.
//         </p>
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

// import React from "react";
// import { Button } from "../components/Button";

// export function IntroductionInterleaved({ next }) {
//   return (
//     <div className="mt-3 sm:mt-5 p-20">
//       <h3 className="text-lg leading-6 font-medium text-gray-900">
//         Instructions: Collaborative Item Naming
//       </h3>
      
//       <div className="mt-6 mb-8 space-y-6">
//         <div className="bg-blue-50 p-4 rounded-lg">
//           <p className="text-sm font-medium">Game Overview:</p>
//           <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
//             <li>You'll participate in two 3-minute rounds</li>
//             <li>You'll collaborate with a partner to name as many items as you can from a given category</li>
//             <li>In each round, you'll take turns naming items</li>
//           </ul>
//         </div>

//         <div className="space-y-4">
//           <p className="text-sm font-medium">How It Works:</p>
//           <ul className="list-disc pl-5 space-y-2 text-sm">
//             <li>When it's your turn, name one item from the category</li>
//             <li>After you submit an item by pressing Enter, it becomes your partner's turn</li>
//             <li>Wait for your partner to submit their item before your next turn</li>
//             <li>Continue alternating turns until the time runs out</li>
//           </ul>
//         </div>

//         <div className="bg-gray-50 p-4 rounded-lg">
//           <p className="text-sm font-medium">Display and Scoring:</p>
//           <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
//             <li>The screen will show each word as it's submitted</li>
//             <li>You can see the current round score and remaining time</li>
//             <li>Score is based on the total number of items named together</li>
//           </ul>
//         </div>

//         <div className="bg-yellow-50 p-4 rounded-lg">
//           <p className="text-sm font-medium">Important:</p>
//           <ul className="list-disc pl-5 mt-2 space-y-2 text-sm">
//             {/* <li>Success depends on quick responses and good teamwork</li> */}
//             <li>Each word should be unique - no repetitions</li>
//             <li>Your bonus will be calculated from both rounds' scores</li>
//             <li>You will receive the code for your bonus after you complete the post-task assessment</li>
//             {/* <li>The faster you and your partner respond, the more words you can list together</li> */}
//           </ul>
//         </div>
//       </div>

//       <Button handleClick={next} autoFocus>
//         <p>Next</p>
//       </Button>
//     </div>
//   );
// }

import React from "react";
import { Button } from "../components/Button";

export function IntroductionInterleaved({ next }) {
  return (
    <div className="max-w-2xl mx-auto mt-3 sm:mt-5 p-8">
      <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
        Instructions: Collaborative Item Naming
      </h3>
      
      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="text-base font-bold mb-3">Game Overview:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>You'll participate in two 3-minute rounds</li>
            <li>You'll collaborate with a partner to name as many items as you can from a given category</li>
            <li>In each round, you'll take turns naming items</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-base font-bold mb-3">How It Works:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>When it's your turn, name one item from the category</li>
            <li>After you submit an item by pressing Enter, it becomes your partner's turn</li>
            <li>Wait for your partner to submit their item before your next turn</li>
            <li>Continue alternating turns until the time runs out</li>
          </ul>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-base font-bold mb-3">Display and Scoring:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>The screen will show each word as it's submitted</li>
            <li>You can see the current round score and remaining time</li>
            <li>Score is based on the total number of items named together</li>
          </ul>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <p className="text-base font-bold mb-3">Important:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Each word should be unique - no repetitions</li>
            <li>Your bonus will be calculated from both rounds' scores</li>
            <li>You will receive the code for your bonus after you complete the post-task assessment</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button handleClick={next} autoFocus>
          Next
        </Button>
      </div>
    </div>
  );
}