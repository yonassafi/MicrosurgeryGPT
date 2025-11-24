export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  apiKey: string | null;
}

export interface TopicSuggestion {
  title: string;
  query: string;
}