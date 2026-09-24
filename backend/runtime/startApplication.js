export function createDependencyReadinessCheck({ isDatabaseConnected, pingCache }) {
  return async () => {
    if (!isDatabaseConnected()) return false;
    return (await pingCache()) === "PONG";
  };
}

export async function startApplication({
  app,
  connectDatabase,
  verifyCache,
  reconcileCleanup = async () => {},
  onReady,
  host,
  port,
}) {
  await connectDatabase();
  await verifyCache();
  await reconcileCleanup();
  onReady();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => resolve(server));
    server.once("error", reject);
  });
}
