export class SFTClient {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    async generate(message, agentName, sessionId, userId) {
        try {
            const response = await fetch(`${this.baseUrl}/process_message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_message: message,
                    agent_name: agentName,
                    session_id: sessionId,
                    user_id: userId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.response.choices[0].message.content;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
}
