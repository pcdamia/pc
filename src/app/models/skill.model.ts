export interface Skill {
  id: string;
  name: string;
  whereUsed?: string[];
  whereLearned?: string;
  order?: number;
}
