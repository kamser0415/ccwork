export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[]; // 항상 배열(없으면 []). 정규화는 fetchNotes 경계에서 보장
  createdAt: string;
  updatedAt: string;
}
