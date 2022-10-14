export type Category =
  | "question"
  | "confession"
  | "flirt"
  | "compliment"
  | "never";

export interface Submission {
  question: string;
  user: string;
  category: Category;
}
