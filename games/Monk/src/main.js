async function bootstrap() {
  const { createGame } = await import('./core/game.js');
  createGame();
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap Monk Awakening', error);
});
