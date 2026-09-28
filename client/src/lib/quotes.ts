// A small curated library of learning/growth quotes for the Today page's
// closing banner. Picked once per page load (see randomQuote) — there's no
// need for a network fetch here, the whole point is it should show up
// instantly and work offline.
export interface Quote {
  text: string
  author: string
}

export const quotes: Quote[] = [
  { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
  { text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: 'Anyone who stops learning is old, whether at twenty or eighty.', author: 'Henry Ford' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: 'Education is not the filling of a pail, but the lighting of a fire.', author: 'W.B. Yeats' },
  { text: 'The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.', author: 'Brian Herbert' },
  { text: 'Change is the end result of all true learning.', author: 'Leo Buscaglia' },
  { text: 'The only source of knowledge is experience.', author: 'Albert Einstein' },
  { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin' },
  { text: 'Learning never exhausts the mind.', author: 'Leonardo da Vinci' },
  { text: 'I am always doing that which I cannot do, in order that I may learn how to do it.', author: 'Pablo Picasso' },
  { text: "It's not that I'm so smart. I just stay with problems longer.", author: 'Albert Einstein' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act but a habit.', author: 'Will Durant' },
  { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: "It always seems impossible until it's done.", author: 'Nelson Mandela' },
  { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius' },
  { text: 'Growth is never by mere chance; it is the result of forces working together.', author: 'James Cash Penney' },
  { text: 'What we learn with pleasure we never forget.', author: 'Alfred Mercier' },
  { text: 'Curiosity is the wick in the candle of learning.', author: 'William Arthur Ward' },
  { text: 'In learning you will teach, and in teaching you will learn.', author: 'Phil Collins' },
  { text: 'Once you stop learning, you start dying.', author: 'Albert Einstein' },
  { text: 'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.', author: 'Rumi' },
  { text: "You don't have to be great to start, but you have to start to be great.", author: 'Zig Ziglar' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'There are no shortcuts to any place worth going.', author: 'Beverly Sills' },
  { text: 'A river cuts through rock, not because of its power, but because of its persistence.', author: 'Jim Watkins' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Proverb' },
  { text: 'Patience, persistence and perspiration make an unbeatable combination for success.', author: 'Napoleon Hill' },

  { text: 'Develop a passion for learning. If you do, you will never cease to grow.', author: "Anthony J. D'Angelo" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: 'Dr. Seuss' },
  { text: 'Knowledge is power.', author: 'Francis Bacon' },
  { text: 'The only person who is educated is the one who has learned how to learn and change.', author: 'Carl Rogers' },
  { text: 'The roots of education are bitter, but the fruit is sweet.', author: 'Aristotle' },
  { text: 'Study without desire spoils the memory, and it retains nothing that it takes in.', author: 'Leonardo da Vinci' },
  { text: 'A wise man can learn more from a foolish question than a fool can learn from a wise answer.', author: 'Bruce Lee' },
  { text: 'By three methods we may learn wisdom: first, by reflection; second, by imitation; third, by experience.', author: 'Confucius' },
  { text: 'Genius is one percent inspiration and ninety-nine percent perspiration.', author: 'Thomas Edison' },
  { text: 'The beautiful journey of today can only begin when we learn to let go of yesterday.', author: 'Steve Maraboli' },
  { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
  { text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
  { text: 'Continuous effort — not strength or intelligence — is the key to unlocking our potential.', author: 'Winston Churchill' },
  { text: 'It is impossible for a man to learn what he thinks he already knows.', author: 'Epictetus' },
  { text: 'Double your rate of failure and you will double your rate of success.', author: 'Thomas J. Watson' },
  { text: 'There is no failure except in no longer trying.', author: 'Elbert Hubbard' },
  { text: 'Learning is a treasure that will follow its owner everywhere.', author: 'Chinese Proverb' },
  { text: 'Formal education will make you a living; self-education will make you a fortune.', author: 'Jim Rohn' },
  { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates' },
  { text: 'Nothing in life is to be feared, it is only to be understood.', author: 'Marie Curie' },
  { text: 'Every strike brings me closer to the next home run.', author: 'Babe Ruth' },
  { text: 'Perseverance is not a long race; it is many short races one after the other.', author: 'Walter Elliot' },
  { text: 'Great works are performed not by strength but by perseverance.', author: 'Samuel Johnson' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
  { text: 'The only limit to our realization of tomorrow will be our doubts of today.', author: 'Franklin D. Roosevelt' },
  { text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson' },
  { text: "Believe you can and you're halfway there.", author: 'Theodore Roosevelt' },
  { text: 'Difficulties strengthen the mind, as labor does the body.', author: 'Seneca' },
  { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
  { text: 'One child, one teacher, one book, one pen can change the world.', author: 'Malala Yousafzai' },
]

export function randomQuote(random: () => number = Math.random): Quote {
  return quotes[Math.floor(random() * quotes.length)]
}
