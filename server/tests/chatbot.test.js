import { jest } from '@jest/globals';

// 👇 Silence console.error during tests to avoid clutter
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

// ✅ Mock BOTH exports from vector.js
jest.unstable_mockModule('../../chatbot/vector.js', () => ({
  retrieveRelevantDocs: jest.fn(),
  createRetrieverFromDatabase: jest.fn()
}));

// ✅ Mock ChatOpenAI
jest.unstable_mockModule('@langchain/openai', () => {
  const mockCall = jest.fn().mockResolvedValue({
    text: 'George Albert Smith and Georges Méliès directed Cinderella.'
  });
  return {
    ChatOpenAI: jest.fn(() => ({
      call: mockCall
    }))
  };
});

// ✅ Declare vars to hold imported modules/mocks
let callChatbot;
let retrieveRelevantDocs;
let ChatOpenAI;

beforeEach(async () => {
  jest.clearAllMocks();

  // Dynamically import after mocks are applied
  const chatbotModule = await import('../../chatbot/chatbot.js');
  callChatbot = chatbotModule.callChatbot;

  const vectorModule = await import('../../chatbot/vector.js');
  retrieveRelevantDocs = vectorModule.retrieveRelevantDocs;

  const openaiModule = await import('@langchain/openai');
  ChatOpenAI = openaiModule.ChatOpenAI;
});

describe('callChatbot()', () => {
  test('returns an answer string from the model', async () => {
    retrieveRelevantDocs.mockResolvedValue([
      { pageContent: 'George Albert Smith and Georges Méliès directed Cinderella.' }
    ]);

    const result = await callChatbot('Who directed Cinderella?');

    expect(typeof result).toBe('string');
    expect(result).toBe('George Albert Smith and Georges Méliès directed Cinderella.');

    const instance = ChatOpenAI.mock.results[0].value;
    expect(instance.call).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('Who directed Cinderella?')
        })
      ])
    );
  });

  test('returns an error message if something fails', async () => {
    retrieveRelevantDocs.mockRejectedValue(new Error('Vector error'));

    const result = await callChatbot('Who starred in The Notebook?');
    expect(result).toBe('Sorry, I had an issue answering your question.');
  });
});
