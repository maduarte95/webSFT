// import React, { useState } from "react";
// import { usePlayer } from "@empirica/core/player/classic/react";
// import { Button } from "../components/Button";
// import { Alert } from "../components/Alert";


// export function PostQuestions({ next }) {
//   const player = usePlayer();
//   const [responses, setResponses] = useState({
//     strategyAnticipation: "",
//     wordRetrieval: "",
//     overallUsefulness: ""
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setResponses(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     player.set("postQuestResponses", responses);
//     next();
//   };

//   const renderLikertScale = (name, question) => (
//     <div className="mb-4">
//       <label className="block text-sm font-medium text-gray-700 mb-2">{question}</label>
//       <div className="flex justify-between">
//         {[1, 2, 3, 4, 5, 6, 7].map((value) => (
//           <label key={value} className="flex flex-col items-center">
//             <input
//               type="radio"
//               name={name}
//               value={value}
//               checked={responses[name] === value.toString()}
//               onChange={handleChange}
//               className="mb-1"
//             />
//             <span>{value}</span>
//           </label>
//         ))}
//       </div>
//       <div className="flex justify-between text-xs mt-1">
//         <span>Strongly Disagree</span>
//         <span>Strongly Agree</span>
//       </div>
//     </div>
//   );

//   return (

//     <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
//     <Alert title="Bonus">
//       <p>
//         Please submit the following code to receive your bonus:{" "}
//         <strong>{player.id}</strong>.
//       </p>
//       <p className="pt-1">
//         Your final <strong>bonus</strong> is in addition of the{" "}
//         <strong>1 base reward</strong> for completing the HIT.
//       </p>
//     </Alert>
    
//     <div className="max-w-3xl mx-auto p-6">
//       <h2 className="text-2xl font-bold mb-4">Post-Task Questionnaire</h2>
//       <form onSubmit={handleSubmit}>
//         {renderLikertScale(
//           "strategyAnticipation",
//           "I felt that the AI anticipated my strategy during the tasks."
//         )}
//         {renderLikertScale(
//           "wordRetrieval",
//           "The AI interaction helped me retrieve words that I wouldn't have thought of otherwise."
//         )}
//         {renderLikertScale(
//           "overallUsefulness",
//           "Overall, the interaction with the AI was useful across all tasks."
//         )}
//         <Button type="submit">Next</Button>
//       </form>
//     </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";

export function PostQuestions({ next }) {
  const player = usePlayer();
  const game = useGame();
  const [taskData, setTaskData] = useState([]);
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    // const taskType = game.get("taskType");
    // const taskIndices = game.get("taskIndices") || [];
    // const taskCategories = game.get("taskCategories") || [];

    // player.set("taskType", taskType);
    // player.set("taskIndices", taskIndices);
    // player.set("taskCategories", taskCategories);
    const taskType = player.get("taskType");
    const taskIndices = player.get("taskIndices");
    const taskCategories = player.get("taskCategories");
    console.log("Got from player", { taskType, taskIndices, taskCategories });
    const taskCount = taskType === "interleaved" ? 2 : 3;
    const newTaskData = Array.from({ length: taskCount }, (_, i) => ({
      index: taskIndices[i],
      category: taskCategories[i]
    }));
    setTaskData(newTaskData);

    setResponses(newTaskData.map(() => ({
      strategyAnticipation: "",
      wordRetrieval: "",
      overallUsefulness: ""
    })));
  }, [game, player]);

  const handleChange = (taskIndex, questionName, value) => {
    const newResponses = [...responses];
    newResponses[taskIndex] = {
      ...newResponses[taskIndex],
      [questionName]: value
    };
    setResponses(newResponses);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    responses.forEach((response, index) => {
      player.set(`postQuestResponses${index + 1}`, response);
    });
    next();
  };

  const renderLikertScale = (taskIndex, name, question) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{question}</label>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((value) => (
          <label key={value} className="flex flex-col items-center">
            <input
              type="radio"
              name={`${name}_${taskIndex}`}
              value={value}
              checked={responses[taskIndex][name] === value.toString()}
              onChange={(e) => handleChange(taskIndex, name, e.target.value)}
              className="mb-1"
            />
            <span>{value}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  );

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <Alert title="Bonus">
        <p>
          Please submit the following code to receive your bonus:{" "}
          <strong>{player.id}</strong>.
        </p>
        <p className="pt-1">
          Your final <strong>bonus</strong> is in addition of the{" "}
          <strong>1 base reward</strong> for completing the HIT.
        </p>
      </Alert>
      
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Post-Task Questionnaire</h2>
        <form onSubmit={handleSubmit}>
          {taskData.map((task, taskIndex) => (
            <div key={taskIndex} className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Task #{task.index} ({task.category})</h3>
              {renderLikertScale(
                taskIndex,
                "strategyAnticipation",
                "I felt that my partner anticipated my strategy during this task."
              )}
              {renderLikertScale(
                taskIndex,
                "wordRetrieval",
                "The interaction helped me retrieve words that I wouldn't have thought of otherwise in this task."
              )}
              {renderLikertScale(
                taskIndex,
                "overallUsefulness",
                "Overall, the interaction with was useful for this task."
              )}
            </div>
          ))}
          <Button type="submit">Next</Button>
        </form>
      </div>
    </div>
  );
}