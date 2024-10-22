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
    const taskType = player.get("taskType");
    const taskIndices = player.get("taskIndices");
    const taskCategories = player.get("taskCategories");
    console.log("Got from player", { taskType, taskIndices, taskCategories });

    if (taskIndices && taskCategories) {
      const newTaskData = taskIndices.map((taskName, index) => ({
        name: taskName,
        category: taskCategories[index],
        displayIndex: index + 1  // Add 1 to make it 1-based instead of 0-based
      }));
      setTaskData(newTaskData);
      setResponses(newTaskData.map(() => ({
        strategyAnticipation: "",
        wordRetrieval: "",
        overallUsefulness: ""
      })));
    }
  }, [player]);

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
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-700">
          Your partner may have been a human or an artificial intelligence (AI) system. 
          Please recall the tasks you completed and rate the following statements from 
          1 (strongly disagree) to 7 (strongly agree).
        </p>
      </div>
        <form onSubmit={handleSubmit}>
          {taskData.map((task, taskIndex) => (
            <div key={taskIndex} className="mb-8">
              <h3 className="text-xl font-semibold mb-4">
                Task #{task.displayIndex} ({task.category})
              </h3>
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
                "Overall, the interaction was useful for this task."
              )}
              {renderLikertScale(
                taskIndex,
                "partnerHuman",
                "I believe my partner was a human."
              )}
            </div>
          ))}
          <Button type="submit">Next</Button>
        </form>
      </div>
    </div>
  );
}