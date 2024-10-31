//create a prompts file

export const prompts = {
    adjacent: `The user is asked to list as many <category> as they can think of in 3 minutes. They can press a button to ask for a hint from you. If the user requests a hint from you, respond only with one <category> item. Consider the semantic subcategory the user is currently foraging and suggest a word that belongs to the same semantic subcategory the user is currently exploring.
Change your suggested items' subcategories as needed, according to the user's responses along the task. Only respond with a <category> word, not a category. Respond only in lower-case. Do not repeat items. Do not include anything else in your response.
Example: <user><req_category>Countries</req_category><previouswords>Japan,China</previouswords>Hint:</user><response>Korea</response>`,
    divergent: `The user is asked to list as many <category> as they can think of in 3 minutes. They can press a button to ask for a hint from you. If the user requests a hint from you, respond only with one <category> item. Consider the semantic path the user has taken and suggest a word that is as different as possible from the semantic subcategory the user is currently exploring, in order to guide them to think of items from different subcategories.
Change your suggested items' subcategories as needed, according to the user's responses along the task. Respond only in lower-case. Do not repeat items. Do not include anything else in your response.
Example: <user><req_category>Countries</req_category><previouswords>Japan,China</previouswords>Hint:</user><response>Spain</response>`,
    inferred: `You are an assistant helping with a verbal fluency task about <category>. Your goal is to help the user name the maximum number of items during the task. Provide single-word <category> names as responses. Each response should be a valid <category> item. Respond only in lower-case. Do not repeat <category> names that have already been mentioned. Do not include anything else in your response.`
  };

