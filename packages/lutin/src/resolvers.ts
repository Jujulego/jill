export const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
  Subscription: {
    greetings: async function* sayHiIn5Languages() {
      for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
        yield { greetings: hi };
      }
    },
  }
};