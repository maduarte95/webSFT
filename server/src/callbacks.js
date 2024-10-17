import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import { LLM } from "./utils/LLM.js";
import fs from 'fs';
import path from 'path';

export const Empirica = new ClassicListenersCollector();

const categoryMap = {
  A: "animals",
  S: "supermarket",
  C: "clothing"
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


function getOrCreateLLM(playerId, roundName, stageName, treatment) {
  const key = `${playerId}-${roundName}-${stageName}`;
  console.log(`Checking LLM for key: ${key}. Treatment:`, treatment);
  
  // Only create LLMs for specific stages that require them
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
        systemPrompt = "You are an assistant helping with a verbal fluency task about animals. Provide single-word animal names as responses. Do not repeat animal names that have already been mentioned.";
        console.warn(`Warning: Using default prompt for stage ${stageName}. Treatment: ${JSON.stringify(treatment)}`);
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
    interleavedRound1.addStage({ name: firstTask.startsWith('h') ? "HHInterleavedResult" : "VFCollabResult", duration: 300 });
    interleavedRound1.set("category", categoryMap[firstTask.slice(-1)]);
    interleavedRound1.set("treatment", treatment);  // Set treatment for the round

    const interleavedRound2 = game.addRound({ name: "Interleaved2" });
    interleavedRound2.addStage({ name: secondTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab", duration: 30 });
    interleavedRound2.addStage({ name: secondTask.startsWith('h') ? "HHInterleavedResult" : "VFCollabResult", duration: 300 });
    interleavedRound2.set("category", categoryMap[secondTask.slice(-1)]);
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
      round.addStage({ name: resultStageName, duration: 300 });
      round.set("category", categoryMap[categories[index]]);
      console.log("category set to", categoryMap[categories[index]]); //this is being defined, it is correct
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

  console.log(`Task Index set for game ${game.id}:`, taskIndex);
  console.log(`Task Category set for game ${game.id}:`, taskCategory);
});

Empirica.onRoundStart(({ round }) => {
  const game = round.currentGame;
  const players = game.players;
  const treatment = game.get("treatment");
  const taskIndex = game.get("taskIndex");
  const taskCategory = game.get("taskCategory");

  console.log(`Round ${round.get("name")} started for game ${game.id}`);
  console.log(`Task Index for game ${game.id}:`, taskIndex);
  console.log(`Task Category for game ${game.id}:`, taskCategory);

  // Find the index of the current task
  const taskIndexPosition = taskIndex.findIndex(task => task === round.get("name"));
  
  if (taskIndexPosition === -1) {
    console.error(`Failed to find task info for ${round.get("name")} in game ${game.id}`);
    return;
  }

  const category = taskCategory[taskIndexPosition];

  console.log(`Category for round ${round.get("name")}: ${category}`);

  round.set("category", category);

  players.forEach(player => {
    player.round.set("category", category);
    player.round.set("cueType", treatment.cueType);
    player.round.set("taskType", treatment.taskType);

    // For Human-Human collaboration rounds
    if (round.get("name").includes("HHCollab")) {
      const isFirstHHRound = round.get("name") === "HHCollab";
      player.round.set("role", isFirstHHRound ? 
        (player.index === 0 ? "main" : "helper") : 
        (player.index === 0 ? "helper" : "main"));
    }

    console.log(`Round data set for player ${player.id} in round ${round.get("name")} for game ${game.id}`);
  });

  // Additional setup for interleaved rounds
  if (round.get("name").includes("Interleaved")) {
    const firstPlayerId = players[Math.floor(Math.random() * players.length)].id;
    round.set("currentTurnPlayerId", firstPlayerId);
    console.log(`Set currentTurnPlayerId to ${firstPlayerId} for round ${round.get("name")}`);
  }

  console.log(`Round ${round.get("name")} fully set up for game ${game.id}`);
});


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
        const llm = getOrCreateLLM(player.id, roundName, stageName, treatment);
        if (llm) {
          console.log(`onStageStart LLM ready for player ${player.id}, stage ${stageName}, round ${roundName}, game ${game.id}`);
        } else {
          console.log(`onStageStart LLM not required for player ${player.id}, stage ${stageName}, round ${roundName}, game ${game.id}`);
        }
      } catch (error) {
        console.error(`onStageStart Error preparing LLM for player ${player.id}, stage ${stageName}, game ${game.id}:`, error);
      }
    });
  } else {
    console.log(`Stage ${stageName} does not require LLM creation.`);
  }

  if (stage.get("name") === "HHCollab") {
    const players = stage.currentGame.players;
    players.forEach((player, index) => {
      player.set("role", index === 0 ? "main" : "helper");
    });
  }
  if (stage.get("name") === "HHCollabSwitched") {
    const players = stage.currentGame.players;
    players.forEach((player, index) => {
      player.set("role", index === 0 ? "helper" : "main");
    });
  }
});

Empirica.onStageEnded(({ stage }) => {
  if (!stage) {
    console.error("Stage is undefined in onStageEnded");
    return;
  }
  console.log(`${stage.get("name")} stage ended for game ${stage.currentGame.id}`);
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
    // const treatment = currentRound.get("treatment");´
    const treatment = player.currentGame.get("treatment");
    if (!treatment) {
      throw new Error("Treatment not found for the current round");
    }
    console.log(`Treatment for current round: ${JSON.stringify(treatment)}`);
    
    const roundName = currentRound.get("name");
    console.log(`onTrigger called, cueType: ${treatment.cueType}, roundName: ${roundName}`);
    const llm = getOrCreateLLM(player.id, roundName, currentStage.get("name"), treatment);
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
  game.players.forEach(player => {
    if (playerRoundLLMs.has(player.id)) {
      playerRoundLLMs.delete(player.id);
      console.log(`Cleaned up LLMs for player ${player.id} in game ${game.id}`);
    }
  });
});


Empirica.on("player", "requestTimestamp", (ctx, { player }) => {
  const currentTime = Date.now();
  const previousTimestamp = player.get("serverTimestamp");
  console.log(`Server timestamp request:
    Player: ${player.id}
    Current time: ${currentTime}
    Previous timestamp: ${previousTimestamp}
    Time since last request: ${previousTimestamp ? currentTime - previousTimestamp : 'N/A'}ms`);
  
  player.set("serverTimestamp", currentTime);
  
  Empirica.flush().then(() => {
    const storedTimestamp = player.get("serverTimestamp");
    console.log(`Timestamp update for player ${player.id}:
      Set time: ${currentTime}
      Stored time after flush: ${storedTimestamp}
      Difference: ${storedTimestamp - currentTime}ms`);
  });
  
  player.set("requestTimestamp", false);
});