export type Message = {
  role: "user" | "assistant";
  content: string;
  id?: string;
  timestamp?: number;
};
