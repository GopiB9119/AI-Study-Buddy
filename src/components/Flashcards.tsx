import { useState } from 'react';
import { Flashcard } from '../types/flashcard';
import { generateFlashcards } from '../services/api';

export default function Flashcards() {
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    const result = await generateFlashcards(topic.trim());
    setCards(result);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex-1 p-3 border rounded-xl"
          placeholder="Enter a topic (e.g., Java basics)…"
        />
        <button onClick={handleGenerate} className="px-4 py-3 bg-purple-600 text-white rounded-xl">Generate</button>
      </div>

      {loading && <p className="text-gray-600">Generating flashcards…</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.id} className="bg-white border rounded-2xl p-4 shadow hover:shadow-md transition">
            <p className="font-semibold">{card.question}</p>
            <p className="text-gray-600 mt-2">{card.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
