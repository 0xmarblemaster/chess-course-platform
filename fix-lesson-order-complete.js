// Fix lesson order_index values to match the intended sequence from admin panel
// This script will assign proper sequential order_index values

const correctLessonOrder = [
  // Основы шахмат (Chess Fundamentals)
  { id: 1, title: "Король", order: 1 },
  { id: 2, title: "Ладья", order: 2 },
  { id: 17, title: "Слон", order: 3 },
  { id: 18, title: "Ферзь", order: 4 },
  { id: 19, title: "Конь", order: 5 },
  { id: 20, title: "Пешка", order: 6 },
  
  // Шах и Мат (Check and Checkmate)
  { id: 22, title: "Шах", order: 7 },
  { id: 23, title: "Мат", order: 8 },
  
  // Шахматная нотация (Chess Notation)
  { id: 25, title: "Шахматная нотация", order: 9 },
  
  // Рокировка (Castling)
  { id: 26, title: "Что такое рокировка", order: 10 },
  { id: 27, title: "Зачем делать рокировку?", order: 11 },
  
  // Ничья (Draw)
  { id: 29, title: "Ничья из-за недостатка материала", order: 12 },
  { id: 28, title: "Вечный шах", order: 13 },
  { id: 31, title: "Пат", order: 14 },
  { id: 30, title: "Троекратное повторение позиции", order: 15 },
  { id: 32, title: "Ничья по согласию", order: 16 },
  
  // Сравнительная сила фигур (Piece Values)
  { id: 33, title: "Стоимость фигур", order: 17 },
  
  // Мат тяжелыми фигурами (Checkmate with Heavy Pieces)
  { id: 34, title: "Мат тяжелыми фигурами", order: 18 },
  
  // Связка (Pin)
  { id: 35, title: "Связка", order: 19 },
  { id: 36, title: "Связка", order: 20 }
];

console.log('Correct lesson order:');
correctLessonOrder.forEach(lesson => {
  console.log(`${lesson.order}. ID=${lesson.id} - ${lesson.title}`);
});

// This would be used to update the database
// For now, we'll implement the fix in the frontend code