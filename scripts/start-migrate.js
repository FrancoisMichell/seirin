(async () => {
  try {
    const datasourceModule = await import('../dist/db/datasource.js');
    const dataSource = datasourceModule.default;
    if (!dataSource) throw new Error('DataSource not found in dist/db/datasource.js');

    if (process.env.RUN_MIGRATIONS === 'true') {
      await dataSource.initialize();
      console.log('[migrate] Running migrations...');
      await dataSource.runMigrations();
      console.log('[migrate] Migrations completed.');
      await dataSource.destroy();
    } else {
      console.log('[migrate] Skipping migrations (RUN_MIGRATIONS is not true).');
    }

    const { spawn } = await import('node:child_process');
    const app = spawn('node', ['dist/main'], { stdio: 'inherit' });
    app.on('exit', (code) => process.exit(code ?? 0));
  } catch (err) {
    console.error('[migrate] Failed to run migrations:', err);
    process.exit(1);
  }
})();
