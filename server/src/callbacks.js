import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import { LLM } from "./utils/LLM.js";
import fs from 'fs';
import path from 'path';

export const Empirica = new ClassicListenersCollector();

const categoryMap = {
  A: "animals",
  S: "supermarket items",
  C: "clothing items"
};

// Create a nested map to store LLM instances for each player and round
const playerRoundLLMs = new Map();
// // Load LLM configuration
// const configPath = path.join(__dirname, '..', 'llm_config.json');
// const llmConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));


function readPromptFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading prompt file: ${error}`);
    return null;
  }
}


function getOrCreateLLM(playerId, roundName, stageName, treatment, category) {
  const key = `${playerId}-${roundName}-${stageName}`;
  console.log(`Checking LLM for key: ${key}. Treatment:`, treatment);
  
  const llmRequiredStages = ["VerbalFluencyCollab", "VerbalFluencyTask", "LocalAPI"];
  
  if (!llmRequiredStages.includes(stageName)) {
    console.log(`LLM not required for stage: ${stageName}`);
    return null;
  }

  if (!playerRoundLLMs.has(key)) {
    let systemPrompt = "";

    if (stageName === "VerbalFluencyCollab" || stageName === "VerbalFluencyTask") {
      if (treatment && treatment.cueType === "adjacent") {
        const promptPath = path.join(__dirname, '..', 'prompts', 'adjacent.txt');
        systemPrompt = readPromptFile(promptPath);
      } else if (treatment && treatment.cueType === "divergent") {
        const promptPath = path.join(__dirname, '..', 'prompts', 'divergent.txt');
        systemPrompt = readPromptFile(promptPath);
      } else if (treatment && treatment.cueType === "inferred") {
        const promptPath = path.join(__dirname, '..', 'prompts', 'inferred.txt');
        systemPrompt = readPromptFile(promptPath);
      }
      
      if (!systemPrompt) {
        systemPrompt = `You are an assistant helping with a verbal fluency task about ${category}. Provide single-word ${category} names as responses. Do not repeat ${category} names that have already been mentioned.`;
        console.warn(`Warning: Using default prompt for stage ${stageName}. Treatment: ${JSON.stringify(treatment)}`);
      } else {
        // Replace <category> placeholder with actual category
        systemPrompt = systemPrompt.replace(/<category>/g, category);
      }
    } else if (stageName === "LocalAPI") {
      console.log(`Creating LLM for LocalAPI stage without a specific system prompt.`);
    } else {
      console.warn(`Unexpected stage name: ${stageName}. Using a generic system prompt.`);
      systemPrompt = "You are a helpful assistant. Please respond to the user's queries.";
    }

    console.log(`Creating new LLM for key ${key} with systemPrompt: ${systemPrompt || "No system prompt"}`);
    
    try {
      playerRoundLLMs.set(key, new LLM(systemPrompt));
      console.log(`LLM created for key ${key}`);
    } catch (error) {
      console.error(`Error creating LLM for key ${key}:`, error);
      throw error;
    }
  } else {
    console.log(`Existing LLM found for key ${key}`);
  }
  
  return playerRoundLLMs.get(key);
}


function setupRounds(game, treatment) {
  const { taskType, cueType, interOrder, selfOrder, categoryOrder } = treatment
  const players = game.players;
  
  if (taskType === 'interleaved') {
    const [firstTask, secondTask] = interOrder.split('_');
    
    const interleavedRound1 = game.addRound({ name: "Interleaved1" });
    interleavedRound1.addStage({ name: firstTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab", duration: 30 });
    interleavedRound1.addStage({ name: "SwitchesId", duration: 300 });
    interleavedRound1.addStage({ name: firstTask.startsWith('h') ? "HHInterleavedResult" : "VFCollabResult", duration: 300 });
    interleavedRound1.set("category", categoryMap[firstTask.slice(-1)]);
    console.log("interleavedRound1 category set to", categoryMap[firstTask.slice(-1)]); 
    interleavedRound1.set("treatment", treatment);  // Set treatment for the round

    const interleavedRound2 = game.addRound({ name: "Interleaved2" });
    interleavedRound2.addStage({ name: secondTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab", duration: 30 });
    interleavedRound2.addStage({ name: "SwitchesId", duration: 300 });
    interleavedRound2.addStage({ name: secondTask.startsWith('h') ? "HHInterleavedResult" : "VFCollabResult", duration: 300 });
    interleavedRound2.set("category", categoryMap[secondTask.slice(-1)]);
    console.log("interleavedRound2 category set to", categoryMap[secondTask.slice(-1)]);
    interleavedRound2.set("treatment", treatment);  // Set treatment for the round

  } else if (taskType === 'selfinitiated') {
    const taskOrder = selfOrder.split('_');
    const categories = categoryOrder.split('');

    taskOrder.forEach((task, index) => {
      let roundName, taskStageName, resultStageName;
      
      if (task === 'LLM') {
        roundName = "VerbalFluencyTask";
        taskStageName = "VerbalFluencyTask";
        resultStageName = "VFResult";
      } else {
        roundName = task === 'HH' ? (index === 0 ? "HHCollab" : "HHCollabSwitched") : task;
        taskStageName = roundName;
        resultStageName = "HHCollabResult";
      }

      const round = game.addRound({ name: roundName });
      round.addStage({ name: taskStageName, duration: 30 });
      round.addStage({ name: "SwitchesId", duration: 300 });
      round.addStage({ name: resultStageName, duration: 300 });
      round.set("category", categoryMap[categories[index]]);
      console.log(roundName, "category set to", categoryMap[categories[index]]); //this is being defined, it is correct
      round.set("treatment", treatment);  // Set treatment for the round

      console.log(`Round ${roundName} set up with stages: ${taskStageName} and ${resultStageName}`);
    });
  }

  game.set("cueType", cueType);
  game.set("taskType", taskType);
}


Empirica.onGameStart(({ game }) => {
  const treatment = game.get("treatment");
  setupRounds(game, treatment);
  console.log(`Game ${game.id} rounds set up for treatment:`, treatment);

  let taskIndex = [];
  let taskCategory = [];

  if (treatment.taskType === 'interleaved') {
    const [firstTask, secondTask] = treatment.interOrder.split('_');
    
    taskIndex = [
      firstTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab",
      secondTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab"
    ];
    
    taskCategory = [
      categoryMap[firstTask.slice(-1)],
      categoryMap[secondTask.slice(-1)]
    ];
  } else if (treatment.taskType === 'selfinitiated') {
    const taskOrder = treatment.selfOrder.split('_');
    const categories = treatment.categoryOrder.split('');
    
    taskIndex = taskOrder.map((task, index) => {
      if (task === 'LLM') {
        return "VerbalFluencyTask";
      } else if (task === 'HH') {
        return index === 0 ? "HHCollab" : "HHCollabSwitched";
      }
    });

    taskCategory = categories.map(category => categoryMap[category]);
  }

  game.set("taskIndex", taskIndex);
  game.set("taskCategory", taskCategory);
  game.set("currentRoundIndex", 0);  // Initialize round counter
  game.set("hhRoundIndex", 0);       // Initialize HH round counter
  console.log(`Task Index set for game ${game.id}:`, taskIndex);
  console.log(`Task Category set for game ${game.id}:`, taskCategory);
});



Empirica.onRoundStart(({ round }) => {
  const game = round.currentGame;
  const players = game.players;
  const treatment = game.get("treatment");
  const taskIndex = game.get("taskIndex");
  const taskCategory = game.get("taskCategory");
  const currentRoundIndex = game.get("currentRoundIndex");

  console.log(`Round ${round.get("name")} started for game ${game.id}`);
  console.log(`Current round index: ${currentRoundIndex}`);
  console.log(`Task Index for game ${game.id}:`, taskIndex);
  console.log(`Task Category for game ${game.id}:`, taskCategory);

  const category = taskCategory[currentRoundIndex];
  console.log(`Category for round ${round.get("name")}: ${category}`);
  
  round.set("category", category);

  players.forEach((player, playerArrayIndex) => {
    player.round.set("category", category);
    player.round.set("cueType", treatment.cueType);
    player.round.set("taskType", treatment.taskType);

    // If it's a HH round (either HHCollab or HHCollabSwitched), set roles based on HH round index
    if (round.get("name").includes("HHCollab")) {
      const hhRoundIndex = game.get("hhRoundIndex") || 0;
      
      console.log(`Role assignment debug:
        Round name: ${round.get("name")}
        HH Round Index: ${hhRoundIndex}
        Player Array Index: ${playerArrayIndex}
        Current round index: ${currentRoundIndex}
      `);

      // Set role based on hhRoundIndex (alternating)
      const mainRole = hhRoundIndex % 2 === 0 ? 
        (playerArrayIndex === 0 ? "main" : "helper") : 
        (playerArrayIndex === 0 ? "helper" : "main");
      
      player.round.set("role", mainRole);
      player.set("role", mainRole);
      
      // Only increment hhRoundIndex after processing all players
      if (playerArrayIndex === players.length - 1) {
        game.set("hhRoundIndex", hhRoundIndex + 1);
      }
      
      console.log(`Final role assignment:
        Player ID: ${player.id}
        Player Array Index: ${playerArrayIndex}
        HH Round: ${hhRoundIndex}
        Round Name: ${round.get("name")}
        Role: ${mainRole}
      `);
    }
  });

  if (round.get("name").includes("Interleaved")) {
    const firstPlayerId = players[Math.floor(Math.random() * players.length)].id;
    round.set("currentTurnPlayerId", firstPlayerId);
  }
});

// Empirica.onStageStart(({ stage }) => {
//   const startTime = Date.now();
//   stage.set("serverStartTime", startTime);
//   console.log(`Server start time set for stage ${stage.get("name")} at ${startTime} for game ${stage.currentGame.id}`);
  
//   if (!stage) {
//     console.error("Stage is undefined in onStageStart");
//     return;
//   }
  
//   const stageName = stage.get("name");
//   const game = stage.currentGame;
//   const treatment = game.get("treatment");
//   console.log(`Stage ${stageName} started for game ${game.id}. Treatment:`, treatment);

//   const llmStages = ["LocalAPI", "VerbalFluencyTask", "VerbalFluencyCollab"];

//   if (llmStages.includes(stageName)) {
//     game.players.forEach(player => {
//       try {
//         const roundName = player.currentRound.get("name");
//         const category = player.currentRound.get("category");
//         const llm = getOrCreateLLM(player.id, roundName, stageName, treatment, category);
//         if (llm) {
//           console.log(`onStageStart LLM ready for player ${player.id}, stage ${stageName}, round ${roundName}, game ${game.id}, category ${category}`);
//         } else {
//           console.log(`onStageStart LLM not required for player ${player.id}, stage ${stageName}, round ${roundName}, game ${game.id}, category ${category}`);
//         }
//       } catch (error) {
//         console.error(`onStageStart Error preparing LLM for player ${player.id}, stage ${stageName}, game ${game.id}:`, error);
//       }
//     });
//   } else {
//     console.log(`Stage ${stageName} does not require LLM creation.`);
//   }

//   if (stage.get("name") === "HHCollab") {
//     const players = stage.currentGame.players;
//     players.forEach((player, index) => {
//       player.set("role", index === 0 ? "main" : "helper");
//     });
//   }
//   if (stage.get("name") === "HHCollabSwitched") {
//     const players = stage.currentGame.players;
//     players.forEach((player, index) => {
//       player.set("role", index === 0 ? "helper" : "main");
//     });
//   }
// });

Empirica.onStageStart(({ stage }) => {
  const startTime = Date.now();
  stage.set("serverStartTime", startTime);
  console.log(`Server start time set for stage ${stage.get("name")} at ${startTime} for game ${stage.currentGame.id}`);
  
  if (!stage) {
    console.error("Stage is undefined in onStageStart");
    return;
  }
  
  const stageName = stage.get("name");
  const game = stage.currentGame;
  const treatment = game.get("treatment");
  console.log(`Stage ${stageName} started for game ${game.id}. Treatment:`, treatment);

  const llmStages = ["LocalAPI", "VerbalFluencyTask", "VerbalFluencyCollab"];

  if (llmStages.includes(stageName)) {
    game.players.forEach(player => {
      try {
        const roundName = player.currentRound.get("name");
        const category = player.currentRound.get("category");
        const llm = getOrCreateLLM(player.id, roundName, stageName, treatment, category);
        if (llm) {
          console.log(`onStageStart LLM ready for player ${player.id}, stage ${stageName}, round ${roundName}, game ${game.id}, category ${category}`);
        } else {
          console.log(`onStageStart LLM not required for player ${player.id}, stage ${stageName}, round ${roundName}, game ${game.id}, category ${category}`);
        }
      } catch (error) {
        console.error(`onStageStart Error preparing LLM for player ${player.id}, stage ${stageName}, game ${game.id}:`, error);
      }
    });
  } else {
    console.log(`Stage ${stageName} does not require LLM creation.`);
  }
});

Empirica.onStageEnded(({ stage }) => {
  if (!stage) {
    console.error("Stage is undefined in onStageEnded");
    return;
  }
  const stageName = stage.get("name");
  console.log(`${stageName} stage ended for game ${stage.currentGame.id}`);

  // For stages that generate words
  wordStages = ["HHInterleaved", "VerbalFluencyCollab", "HHCollab", "HHCollabSwitched"];

  if (wordStages.includes(stageName)) {
    const round = stage.round;
    const players = stage.currentGame.players;
    
    players.forEach(player => {
      // If the words are in round, copy them to player.round
      if (round.get("words")) {
        player.round.set("words", round.get("words"));
      }
      // If they're already in player.round (AI case), they're already saved correctly
    });
  }
});

Empirica.onRoundEnded(({ round }) => {
  const game = round.currentGame;
  const currentRoundIndex = game.get("currentRoundIndex");

  // Increment the round counter for next round
  
  game.set("currentRoundIndex", currentRoundIndex + 1);
  console.log(`Round ${round.get("name")} ended. New round index: ${currentRoundIndex + 1}`);
  // Add score to player's cumulative score
  game.players.forEach((player) => {
    // Get current cumulative score
    const currentScore = player.get("score") || 0;
    // Get the round score
    const roundScore = player.round.get("score") || 0;
    // Update cumulative score
    player.set("score", currentScore + roundScore);
    
    console.log(`Updated cumulative score for player ${player.id}:
      Previous score: ${currentScore}
      Round score: ${roundScore}
      New total: ${currentScore + roundScore}`);
  });
});


Empirica.on("player", "apiTrigger", async (ctx, { player }) => {
  console.log(`API trigger changed for player ${player.id} in game ${player.currentGame.id}`);
  const currentStage = player.currentStage;
  const currentRound = player.currentRound;
  console.log(`Current stage name: ${currentStage.get("name")}, game ${player.currentGame.id}`);

  if (!player.get("apiTrigger")) {
    console.log(`API trigger is false, skipping API call for player ${player.id}, game ${player.currentGame.id}`);
    return;
  }

  console.log(`Processing API call for player ${player.id}, game ${player.currentGame.id}`);

  try {
    const treatment = player.currentGame.get("treatment");
    if (!treatment) {
      throw new Error("Treatment not found for the current round");
    }
    console.log(`Treatment for current round: ${JSON.stringify(treatment)}`);
    
    const roundName = currentRound.get("name");
    const category = player.round.get("category"); // Get the category from the round
    console.log(`onTrigger called, cueType: ${treatment.cueType}, roundName: ${roundName}, category: ${category}`);
    const llm = getOrCreateLLM(player.id, roundName, currentStage.get("name"), treatment, category);
    console.log(`onTrigger - LLM retrieved for player ${player.id}, game ${player.currentGame.id}`);

    let userPrompt;
    switch (currentStage.get("name")) {
      case "apiInteraction":
      case "LocalAPI":
        userPrompt = "Cheesed to meet you!";
        break;
      case "VerbalFluencyTask":
      case "VerbalFluencyCollab":
        const pastWords = player.round.get("words") || [];
        const lastWord = player.round.get("lastWord") || "";
        userPrompt = `Hint requested. Past words: ${pastWords.map(w => w.text).join(", ")}. Last word: ${lastWord}`;
        break;
      default:
        throw new Error("Unsupported stage for API call");
    }

    const response = await llm.generate(userPrompt);
    console.log(`API response received for player ${player.id}, game ${player.currentGame.id}:`, response);
    
    await player.stage.set("apiResponse", response);
    console.log(`API response set on stage ${currentStage.get("name")} for player ${player.id}, game ${player.currentGame.id}`);

  } catch (error) {
    console.error(`API call or state update failed for player ${player.id}, game ${player.currentGame.id}`, error);
    await player.stage.set("apiError", error.message);
  } finally {
    await player.set("apiTrigger", false);
    console.log(`API trigger reset to false for player ${player.id}, game ${player.currentGame.id}`);
  }
});


Empirica.onGameEnded(({ game }) => {
  console.log(`Game ${game.id} ended`);
  const taskType = game.get("taskType");
  const taskIndices = game.get("taskIndex");
  const taskCategories = game.get("taskCategory");
  console.log(`Task type: ${taskType}, taskIndices: ${taskIndices}, taskCategories: ${taskCategories}`);

  // Find all LLM keys associated with this game's players
  const keysToDelete = [];
  for (const [key, llm] of playerRoundLLMs.entries()) {
    game.players.forEach(player => {
      if (key.startsWith(`${player.id}-`)) {
        keysToDelete.push(key);
        console.log(`Marked LLM key for deletion: ${key}`);
      }
    });
  }

  // Delete the LLMs
  keysToDelete.forEach(key => {
    playerRoundLLMs.delete(key);
    console.log(`Deleted LLM for key: ${key}`);
  });

  // Log the size of the LLM map after cleanup
  console.log(`LLM map size after cleanup: ${playerRoundLLMs.size}`);

  game.players.forEach(player => {
    player.set("taskType", taskType);
    player.set("taskIndices", taskIndices);
    player.set("taskCategories", taskCategories);
    player.set("requestTimestamp", false);
    console.log(`Game ended; player ${player.id} task type, indices, and categories recorded and requestTimestamp reset`);
  });
});

Empirica.on("player", "requestTimestamp", async (ctx, { player }) => {
  const changes = {
    timestamp: Date.now(),
    requestFlag: false
  };
  
  // Apply all changes at once
  await Promise.all([
    player.set("serverTimestamp", changes.timestamp),
    player.set("requestTimestamp", changes.requestFlag)
  ]);
  
  // Now flush
  await Empirica.flush();
  
  // Log after everything is completed
  const storedTimestamp = player.get("serverTimestamp");
  console.log(`Timestamp update completed for player ${player.id}:
    Set time: ${changes.timestamp}
    Stored time: ${storedTimestamp}
    Request flag: ${player.get("requestTimestamp")}
  `);
});

