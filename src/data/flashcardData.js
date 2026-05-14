export const flashcardLevels = [
  {
    id: "A1",
    title: "Niveau A1",
    description: "Kosakata dasar untuk pemula.",
    chapters: Array.from({ length: 12 }, (_, i) => ({
      id: `A1-K${i + 1}`,
      title: `Kapitel ${i + 1}`,
      cards: [] // Tempat untuk memasukkan flashcard (berupa objek { front: '', back: '', image: '' })
    }))
  },
  {
    id: "A2",
    title: "Niveau A2",
    description: "Kosakata tingkat dasar lanjutan.",
    chapters: Array.from({ length: 12 }, (_, i) => ({
      id: `A2-K${i + 1}`,
      title: `Kapitel ${i + 1}`,
      cards: [] 
    }))
  },
  {
    id: "B1",
    title: "Niveau B1",
    description: "Kosakata tingkat menengah.",
    chapters: Array.from({ length: 12 }, (_, i) => ({
      id: `B1-K${i + 1}`,
      title: `Kapitel ${i + 1}`,
      cards: [] 
    }))
  },
  {
    id: "B2",
    title: "Niveau B2",
    description: "Kosakata tingkat menengah atas.",
    chapters: Array.from({ length: 12 }, (_, i) => ({
      id: `B2-K${i + 1}`,
      title: `Kapitel ${i + 1}`,
      cards: [] 
    }))
  }
];

// Contoh format cara mengisi flashcard nantinya:
/*
cards: [
  {
    id: 1,
    front: "der Apfel",
    back: "Apel",
    image: "url_gambar_jika_ada", // Opsional
    example: "Ich esse einen Apfel." // Opsional
  }
]
*/
