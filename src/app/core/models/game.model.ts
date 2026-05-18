export interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: GameCategory;
}

export interface GameCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}
