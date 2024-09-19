# Empirica Semantic Foraging Task Experiment

This repository contains an Empirica-based experiment for conducting Semantic Foraging Tasks (SFT) with LLM assistance.

## Installation

1. Clone this repository.
2. Install dependencies in both the server and client directories:
   ```
   cd server && npm install
   cd ../client && npm install
   ```

3. Copy `.env.example` to `.env` and add your TogetherAI credentials:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file to include your TogetherAI API key.

## Running the Experiment Locally

1. In the experiment root directory, start the Empirica server:
   ```
   empirica
   ```

   To start a fresh experiment (deleting previous data):
   ```
   rm .empirica/local/tajriba.json && empirica
   ```

2. Access the admin panel at `http://localhost:3000/admin/` to create a batch and choose treatment options.

3. The experiment will be available at `http://localhost:3000/`.

Data is stored in `.empirica/local/tajriba.json`.

## Exporting Data

To export data as a zip file:
```
empirica export
```

## Experiment Description

### General Information

- LLMs are created at the start of every round, with history and system prompts varying based on experiment conditions.
- The user prompt contains the last word produced by the user.
- Rounds correspond to different modalities of VFT (human-led and collaborative).
- Each task has a duration of 3 minutes (10 seconds for testing).
- A task summary is presented at the end of every round.
- Words from the task are saved to the **player and round** as a list of items with attributes for text (the word) and source (user or AI).
- The round score corresponds to the number of human-produced words in the round and is saved to the **player and round**.

### Experiment Flow

1. Intro Steps (not yet implemented)
   - Consent form
   - Pre-task questionnaire

2. Round 0: testRound (for testing API functionality; later for testing transcription)
   - Stage: LocalAPI

3. Round 1: VFTask (human-led semantic foraging task)
   - Stage 1: VerbalFluencyTask (3 minutes)
     - Human-led SFT where users can request hints from the LLM
   - Stage 2: VFResult
     - Displays task summary

4. Round 2: VFTCollab (collaborative semantic foraging task)
   - Stage 1: VerbalFluencyCollab (3 minutes)
     - Collaborative SFT where human and LLM contribute words in alternating turns
   - Stage 2: VFCollabResult
     - Displays task summary

5. Exit Steps (not yet implemented)
   - Post-task questionnaire

### Data Storage

Data saved to the player and round can be retrieved from the playerRound CSV file after exporting data.
- Words: `player.round.set("words", updatedWords)`
- Score: `player.round.set("score", userWordCount)`
- Last Word: `player.round.set("lastWord", currentWord.trim())`

For communication between client and server:
- getting API Response: `player.stage.get("apiResponse")`
- setting API Trigger: `player.set("apiTrigger", true)`

### Treatments (Experiment Conditions)

Treatments vary the system prompt. Subjects within a batch are assigned randomly to either treatment:

1. Adjacent - LLM words always adjacent
2. Divergent - LLM words always divergent

## Customization

To adjust stage durations, modify the `server/callbacks.js` file (set to 10s for testing).
