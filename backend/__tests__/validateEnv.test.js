const path = require('path');

describe('utils/validateEnv', () => {
  beforeEach(() => { jest.resetModules(); });

  test('exits with code 1 when production and insecure JWT', async () => {
    await new Promise((resolve) => {
      jest.isolateModules(() => {
        // Arrange environment
        process.env.NODE_ENV = 'production';
        process.env.JWT_SECRET = 'your-secret-key'; // default/insecure
        // Ensure DB vars present (or defaults will be used)
        process.env.DB_HOST = process.env.DB_HOST || 'localhost';
        process.env.DB_NAME = process.env.DB_NAME || 'craftmart';
        process.env.DB_USER = process.env.DB_USER || 'user';
        process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'pass';

        const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code) => { throw new Error(`exit:${code}`); }));
        try {
          const { validateEnvironment } = require(path.resolve(__dirname, '../dist/utils/validateEnv.js'));
          validateEnvironment();
        } catch (err) {
          expect(String(err.message)).toContain('exit:1');
          expect(exitSpy).toHaveBeenCalledWith(1);
        } finally {
          exitSpy.mockRestore();
          resolve();
        }
      });
    });
  });

  test('does not exit in development defaults', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(() => {
        try {
          // Arrange minimal dev env
          process.env.NODE_ENV = 'development';
          delete process.env.JWT_SECRET; // use default
          const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code) => { throw new Error(`exit:${code}`); }));
          const { validateEnvironment } = require(path.resolve(__dirname, '../dist/utils/validateEnv.js'));
          // Should not throw/exit in development
          validateEnvironment();
          expect(exitSpy).not.toHaveBeenCalled();
          exitSpy.mockRestore();
          resolve();
        } catch (err) { reject(err); }
      });
    });
  });
});

