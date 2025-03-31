import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import { SFTClient } from "./utils/SFTClient";

export const Empirica = new ClassicListenersCollector();

const categoryMap = {
  A: "animals",
  S: "supermarket items",
  C: "clothing items"
};

// One shared client
const client = new SFTClient();

// Exact agent name mapping - has to correspond to agent names defined in SFTplayground yaml files
const AGENT_NAMES = {
  'adjacent': {
      'animals': 'adjacentAnimals',
      'clothing items': 'adjacentClothes'
  },
  'divergent': {
      'animals': 'divergentAnimals',
      'clothing items': 'divergentClothes'
  },
  'inferred': {
      'animals': 'inferredAnimals',
      'clothing items': 'inferredClothes'
  }
};

function getAgentName(cueType, category) {
  return AGENT_NAMES[cueType][category];
}

function setupRounds(game, treatment) {
  const { taskType, cueType, interOrder, selfOrder, categoryOrder } = treatment
  const players = game.players;
  
  if (taskType === 'interleaved') {
    const [firstTask, secondTask] = interOrder.split('_');
    
    const interleavedRound1 = game.addRound({ name: "Interleaved1" });
    interleavedRound1.addStage({ name: firstTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab", duration: 180 });
    interleavedRound1.addStage({ name: "SwitchesId", duration: 300 });
    interleavedRound1.addStage({ name: firstTask.startsWith('h') ? "HHInterleavedResult" : "VFCollabResult", duration: 300 });
    interleavedRound1.set("category", categoryMap[firstTask.slice(-1)]);
    console.log("interleavedRound1 category set to", categoryMap[firstTask.slice(-1)]); 
    interleavedRound1.set("treatment", treatment);  // Set treatment for the round

    const interleavedRound2 = game.addRound({ name: "Interleaved2" });
    interleavedRound2.addStage({ name: secondTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab", duration: 180 });
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
      round.addStage({ name: taskStageName, duration: 180 });
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

// function gaussianRandom(mean, standardDeviation, min, max) {
//   // Generate two independent uniform random numbers
//   const u = Math.random();
//   const v = Math.random();
  
//   // Transform to standard normal distribution using Box-Muller
//   const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  
//   // Transform to desired mean and standard deviation
//   let result = normal * standardDeviation + mean;
  
//   // Clamp the result between min and max
//   return Math.min(Math.max(result, min), max);
// }



Empirica.onGameStart(({ game }) => {
  const treatment = game.get("treatment");
  const players = game.players;
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

  players.forEach((player) => {
    player.set("slowResponsePenalties", 0);
  });

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

  // initialize agents for LLM rounds

  if (round.get("name") === "VerbalFluencyTask" || 
  (round.get("name").startsWith("Interleaved") && taskIndex[currentRoundIndex] === "VerbalFluencyCollab")) {
  
  // Get agent name based on treatment and category
  const agentName = getAgentName(treatment.cueType, category);
  
  players.forEach(async (player) => {
      try {
          // Create a unique session ID
          // const sessionId = `${player.id}-${game.id}-${round.get("name")}`;
          const sessionId = `${player.currentRound.id}`;
          
          console.log(`Initializing agent ${agentName} for player ${player.id}, session ${sessionId}`);
          
          await client.initAgent(
              agentName,
              sessionId,
              player.id
          );
          
          console.log(`Agent initialization successful for player ${player.id}`);
      } catch (error) {
          console.error(`Agent initialization failed for player ${player.id}:`, error);
      }
  });
}

  players.forEach((player, playerArrayIndex) => {
    player.round.set("category", category);
    player.round.set("cueType", treatment.cueType);
    player.round.set("taskType", treatment.taskType);
    player.round.set("currentRoundIndex", currentRoundIndex);

    // Set partner information based on round name and stage name
    if (round.get("name").startsWith("Interleaved")) {
      // For interleaved rounds, check the stage name
      const currentTask = taskIndex[currentRoundIndex];
      if (currentTask === "HHInterleaved") {
        const partner = players.find(p => p.id !== player.id);
        player.round.set("partner", partner.id);
      } else if (currentTask === "VerbalFluencyCollab") {
        player.round.set("partner", "AI");
      }
    } else if (round.get("name") === "VerbalFluencyTask") {
      // For self-initiated AI round
      player.round.set("partner", "AI");
    } else if (round.get("name") === "HHCollab" || round.get("name") === "HHCollabSwitched") {
      // For self-initiated human rounds
      const partner = players.find(p => p.id !== player.id);
      player.round.set("partner", partner.id);
    }

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

Empirica.onGameEnded(({ game }) => {
  console.log(`Game ${game.id} ended`);
  const taskType = game.get("taskType");
  const taskIndices = game.get("taskIndex");
  const taskCategories = game.get("taskCategory");
  console.log(`Task type: ${taskType}, taskIndices: ${taskIndices}, taskCategories: ${taskCategories}`);

  game.players.forEach(player => {
    player.set("taskType", taskType);
    player.set("taskIndices", taskIndices);
    player.set("taskCategories", taskCategories);
    player.set("requestTimestamp", false);
    console.log(`Game ended; player ${player.id} task type, indices, and categories recorded and requestTimestamp reset`);
  });
});


// Empirica.on("player", "apiTrigger", async (ctx, { player }) => {
//   if (!player.get("apiTrigger")) {
//       console.log("API trigger is false, skipping API call");
//       return;
//   }

//   try {
//       const treatment = player.currentGame.get("treatment");
//       const category = player.round.get("category");
//       const requestTime = Date.now();
      
//       // Get exact agent name from mapping
//       const agentName = getAgentName(treatment.cueType, category);
//       console.log(`Using agent: ${agentName} for category: ${category}, cueType: ${treatment.cueType}`);
      
//       // Create session ID from game and round
//       const sessionId = `${player.id}-${player.currentGame.id}-${player.currentRound.get("name")}`;
      
//       const pastWords = player.round.get("words") || [];
//       const lastWord = player.round.get("lastWord") || "";
//       const userPrompt = `It's your turn. Past words: ${pastWords.map(w => w.text).join(", ")}. Last word: ${lastWord}`;

//       console.log(`Making API call for player ${player.id}, session ${sessionId}`);
//       const response = await client.generate(
//           userPrompt,
//           agentName,
//           sessionId,
//           player.id
//       );

//       // log actual latency
//       const actualresponseTime = Date.now();
//       const actualapiLatency = actualresponseTime - requestTime;
//       console.log("Response received; Latency before artificial delay: ", actualapiLatency);

//       // Add artificial delay
//       const meanDelay = 1500;
//       const stdDev = 500;
//       const minDelay = 500;
//       const maxDelay = 10000;
//       const delay = gaussianRandom(meanDelay, stdDev, minDelay, maxDelay);
//       await new Promise(resolve => setTimeout(resolve, delay));

//       const responseTime = Date.now();
      
//       await player.stage.set("apiResponse", {
//           text: response,
//           timestamp: responseTime,
//           apiLatency: responseTime - requestTime
//       });

//       console.log(`API response delayed, processed and set for player ${player.id}:`, response);

//   } catch (error) {
//       console.error(`API call failed for player ${player.id}:`, error);
//       await player.stage.set("apiError", error.message);
//   } finally {
//       await player.set("apiTrigger", false);
//   }
// });

// API call with retries for duplicated words
Empirica.on("player", "apiTrigger", async (ctx, { player }) => {
  if (!player.get("apiTrigger")) {
      console.log("API trigger is false, skipping API call");
      return;
  }

  try {
      const treatment = player.currentGame.get("treatment");
      const category = player.round.get("category");
      const requestTime = Date.now();
      
      // Get exact agent name from mapping
      const agentName = getAgentName(treatment.cueType, category);
      console.log(`Using agent: ${agentName} for category: ${category}, cueType: ${treatment.cueType}`);
      
      // Create session ID from game and round
      // const sessionId = `${player.id}-${player.currentGame.id}-${player.currentRound.get("name")}`;
      const sessionId = `${player.currentRound.id}`;

      const pastWords = player.round.get("words") || [];
      // const lastWord = player.round.get("lastWord") || ""; //caution - doesn't always get the last word - database flushing issue?
      const tempLastWord = player.round.get("lastWord") || "";
      const lastWord = pastWords.length > 0 ? pastWords[pastWords.length - 1].text : "";
      //getting lastword from list of words works but it's not good for self-initiated rounds -> we need to send all the previous user words to the AI 


      let attempts = 0;
      const maxAttempts = 3;
      let responseText = "";
      let isDuplicate = true;
      let duplicateWords = [];
      
      // Try up to maxAttempts times to get a non-duplicate word
      while (isDuplicate && attempts < maxAttempts) {
          attempts++;
          console.log(`AI response attempt #${attempts}`);

          // let userPrompt = `It's your turn. Past words: ${pastWords.map(w => w.text).join(", ")}. Last word: ${lastWord}`;
          let userPrompt = `It's your turn. Last word: ${lastWord}`;
          // const userPrompt = `It's your turn. Past words: ${pastWords.map(w => w.text).join(", ")}. Last word: ${lastWord}`;
          // If we've had duplicates, add them to the prompt
          if (duplicateWords.length > 0) {
            userPrompt += `. Please suggest a different word. The following words were already used: ${duplicateWords.join(", ")}`;
          }
          console.log(`Making API call for player ${player.id}, session ${sessionId}`);
          
          responseText = await client.generate(
              userPrompt,
              agentName,
              sessionId,
              player.id
          );

          //log templastword
          console.log(`[DEBUG LASTWORD]: ${tempLastWord}`);


          //trim response text
          responseText = responseText.trim();
          
          // Check if this response is a duplicate of any existing word
          isDuplicate = pastWords.some(w => 
              w.text.toLowerCase() === responseText.toLowerCase()
          );
          
          if (isDuplicate) {
              console.log(`Duplicate AI response detected: "${responseText}". Retrying...`);
          } else {
              console.log(`Non-duplicate AI response received: "${responseText}"`);
          }
      }

      // If all attempts resulted in duplicates, log this but still use the last response
      if (isDuplicate) {
          console.log(`Warning: Used duplicate response "${responseText}" after ${maxAttempts} attempts`);
      }

      // log actual latency
      const actualresponseTime = Date.now();
      const actualapiLatency = actualresponseTime - requestTime;
      console.log("Response received; Latency before artificial delay: ", actualapiLatency);

      // // Add artificial delay
      // const meanDelay = 1500;
      // const stdDev = 500;
      // const minDelay = 500;
      // const maxDelay = 10000;
      // const delay = gaussianRandom(meanDelay, stdDev, minDelay, maxDelay);
      // await new Promise(resolve => setTimeout(resolve, delay));

      const responseTime = Date.now();
      
      await player.stage.set("apiResponse", {
          text: responseText,
          timestamp: responseTime,
          apiLatency: responseTime - requestTime
      });

      console.log(`API response delayed, processed and set for player ${player.id}:`, responseText);

  } catch (error) {
      console.error(`API call failed for player ${player.id}:`, error);
      await player.stage.set("apiError", error.message);
  } finally {
      await player.set("apiTrigger", false);
  }
});

Empirica.on("player", "requestTimestamp", async (ctx, { player }) => {
  console.log(`[Timestamp Service] New request from player ${player.id}`);
  console.log(`[Timestamp Service] Current stage: ${player.currentStage.get("name")}`);
  console.log(`[Timestamp Service] Current timestamp: ${player.stage.get("serverTimestamp")}`);

  //only update timestamp if requestTimestamp = true!
  if (!player.get("requestTimestamp")) {
    console.log(`[Timestamp Service] Request flag is false for player ${player.id}. Skipping update.`);
    return;
  }
  
  const timestamp = Date.now();
  
  await player.stage.set("serverTimestamp", timestamp);
  await player.set("requestTimestamp", false);
  await Empirica.flush();

  // player.stage.set("serverTimestamp", timestamp);
  // player.set("requestTimestamp", false);
  //await Empirica.flush();


  //issue: there is a bottleneck here, if the api call from one player is not finished, the timestamp from the other player will not be updated and word submission fails!
  //tried: removing empirica.flush, did not work; batch processing, did not work. try: removing await/ removing await and flush / removing await and keeping await flush
  //consider - queue system; changing timeout in client side; moving timestamps to client side

  //player.stage.set("serverTimestamp", timestamp);
  //player.set("requestTimestamp", false);
  // await Empirica.flush();

  const verifyTimestamp = player.stage.get("serverTimestamp");
  console.log(`[Timestamp Service] Response for ${player.id}:`, {
    set: timestamp,
    verified: verifyTimestamp,
    match: timestamp === verifyTimestamp
  });
});


// Empirica.on("player", "requestTimestamp", async (ctx, { player }) => {
//   console.log(`[Timestamp Service] New request from player ${player.id}`);
//   console.log(`[Timestamp Service] Current stage: ${player.currentStage.get("name")}`);
  
//   if (!player.get("requestTimestamp")) {
//     console.log(`[Timestamp Service] Request flag is false for player ${player.id}. Skipping update.`);
//     return;
//   }
  
//   const timestamp = Date.now();
  
//   // Set the timestamp
//   await player.stage.set("serverTimestamp", timestamp);
//   await Empirica.flush();
  
//   // Verify the timestamp was set correctly (with retries)
//   let verificationSuccess = false;
//   let verifiedTimestamp = null;
//   let retryCount = 0;
//   const maxRetries = 5;
  
//   while (!verificationSuccess && retryCount < maxRetries) {
//     verifiedTimestamp = player.stage.get("serverTimestamp");
//     console.log(`[Timestamp Service] Verification attempt ${retryCount + 1} for ${player.id}: ${verifiedTimestamp}`);
    
//     if (verifiedTimestamp === timestamp) {
//       verificationSuccess = true;
//     } else {
//       retryCount++;
//       // Small delay between retries (50ms)
//       await new Promise(resolve => setTimeout(resolve, 50));
//       // Try to set it again
//       await player.stage.set("serverTimestamp", timestamp);
//       await Empirica.flush();
//     }
//   }
  
//   // Only reset the flag after successful verification or max retries
//   await player.set("requestTimestamp", false);
//   await Empirica.flush();
  
//   console.log(`[Timestamp Service] Response for ${player.id}: { 
//     set: ${timestamp}, 
//     verified: ${verifiedTimestamp}, 
//     match: ${verifiedTimestamp === timestamp},
//     retries: ${retryCount} 
//   }`);
// });