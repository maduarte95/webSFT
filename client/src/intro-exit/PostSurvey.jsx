// import React, { useState } from "react";
// import { usePlayer } from "@empirica/core/player/classic/react";
// import { Button } from "../components/Button";

// export function PostSurvey({ next }) {
//   const player = usePlayer();
//   const [experience, setExperience] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     player.set("postSurveyExperience", experience);
//     next();
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-6">
//       <h2 className="text-2xl font-bold mb-4">Post-Survey</h2>
//       <form onSubmit={handleSubmit}>
//         <div className="mb-4">
//           <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
//             Describe your experience with task #1 and #2:
//           </label>
//           <textarea
//             id="experience"
//             name="experience"
//             rows="6"
//             className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
//             value={experience}
//             onChange={(e) => setExperience(e.target.value)}
//             placeholder="Please share your thoughts and feelings about the tasks..."
//           ></textarea>
//         </div>
//         <Button type="submit">Submit</Button>
//       </form>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
// import { PlayerStage } from "@empirica/core/admin/classic";

export function PostSurvey({ next }) {
  const player = usePlayer();
  const game = useGame();
  const [experiences, setExperiences] = useState([]);
  const [taskData, setTaskData] = useState([]);

  useEffect(() => {
    // const taskType = game.get("taskType");
    // const taskIndices = game.get("taskIndices") || [];
    // const taskCategories = game.get("taskCategories") || [];
    // console.log("Got from game", { taskType, taskIndices, taskCategories });

    // player.set("taskType", taskType);
    // player.set("taskIndices", taskIndices);
    // player.set("taskCategories", taskCategories);

    const taskType = player.get("taskType");
    const taskIndices = player.get("taskIndices");
    const taskCategories = player.get("taskCategories");
    console.log("Got from player", { taskType, taskIndices, taskCategories });

    const taskCount = taskType === "interleaved" ? 2 : 3;
    setTaskData(Array.from({ length: taskCount }, (_, i) => ({
      index: taskIndices[i],
      category: taskCategories[i]
    })));

    setExperiences(Array(taskCount).fill(""));
  }, [game, player]);

  const handleExperienceChange = (index, value) => {
    const newExperiences = [...experiences];
    newExperiences[index] = value;
    setExperiences(newExperiences);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    experiences.forEach((experience, index) => {
      player.set(`postSurveyExperience${index + 1}`, experience);
    });
    next();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Post-Survey</h2>
      <form onSubmit={handleSubmit}>
        {taskData.map((task, index) => (
          <div key={index} className="mb-6">
            <label htmlFor={`experience${index}`} className="block text-sm font-medium text-gray-700 mb-2">
              Describe your experience with task #{task.index} ({task.category}):
            </label>
            <textarea
              id={`experience${index}`}
              name={`experience${index}`}
              rows="4"
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
              value={experiences[index]}
              onChange={(e) => handleExperienceChange(index, e.target.value)}
              placeholder="Please share your thoughts and feelings about this task..."
            ></textarea>
          </div>
        ))}
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}