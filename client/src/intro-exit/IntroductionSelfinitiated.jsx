import React from "react";
import { Button } from "../components/Button";

export function IntroductionSelfinitiated({ next }) {
 return (
   <div className="max-w-2xl mx-auto mt-3 sm:mt-5 p-8">
     <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
       Instructions: Collaborative Item Naming
     </h3>
    
     <div className="space-y-6">
       <div className="bg-blue-50 p-6 rounded-lg">
         <p className="text-base font-bold mb-3">Game Overview:</p>
         <ul className="list-disc pl-5 space-y-2">
           <li>You'll participate in three 3-minute rounds of an item naming task</li>
           <li>In each round, you'll collaborate with a partner to name items from a given category</li>
           <li>You may switch roles between rounds: Main Player ↔ Helper</li>
         </ul>
       </div>

       <div className="bg-white p-6 rounded-lg border border-gray-200">
         <p className="text-base font-bold mb-3">Role Descriptions:</p>
        
         <div className="space-y-4">
           <div>
             <p className="text-base font-bold text-blue-700 mb-2">Main Player:</p>
             <ul className="list-disc pl-5 space-y-2">
               <li>Names as many items as possible from the given category</li>
               <li>Can request hints from the Helper using the "Hint" button</li>
               <li>Must enter at least one word between hint requests</li>
             </ul>
           </div>

           <div>
             <p className="text-base font-bold text-green-700 mb-2">Helper:</p>
             <ul className="list-disc pl-5 space-y-2">
               <li>Can see all words named by the Main Player</li>
               <li>Receives notifications when hints are requested</li>
               <li>Provides one word as a hint when requested</li>
             </ul>
           </div>
         </div>
       </div>

       <div className="bg-yellow-50 p-6 rounded-lg">
         <p className="text-base font-bold mb-3">Important Notes:</p>
         <ul className="list-disc pl-5 space-y-2">
           <li>Press Enter to submit a word</li>
           <li>Each word should be unique - no repetitions</li>
           <li>Score for both players is based on the number of items named by the Main Player</li>
           <li>The screen will display all words named and the current score</li>
           <li>A timer will show the remaining time for each round</li>
           <li>Your bonus will be based on the combined scores from all rounds</li>
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