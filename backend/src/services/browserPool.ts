import puppeteer, { Browser, Page } from 'puppeteer';

interface BrowserInstance {
  browser: Browser;
  inUse: boolean;
  lastUsed: Date;
}

class BrowserPool {
  private pool: BrowserInstance[] = [];
  private readonly maxPoolSize = 3;
  private readonly idleTimeout = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleBrowsers();
    }, 60 * 1000); // Check every minute
  }

  private async createBrowser(): Promise<Browser> {
    return await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-first-run',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows'
      ]
    });
  }

  async getBrowser(): Promise<Browser> {
    // Try to find an available browser in the pool
    for (const instance of this.pool) {
      if (!instance.inUse) {
        // Check if browser is still connected
        if (instance.browser.isConnected()) {
          instance.inUse = true;
          instance.lastUsed = new Date();
          return instance.browser;
        } else {
          // Remove disconnected browser from pool
          const index = this.pool.indexOf(instance);
          this.pool.splice(index, 1);
        }
      }
    }

    // Create new browser if pool is not at max capacity
    if (this.pool.length < this.maxPoolSize) {
      const browser = await this.createBrowser();
      const instance: BrowserInstance = {
        browser,
        inUse: true,
        lastUsed: new Date()
      };
      this.pool.push(instance);
      return browser;
    }

    // Wait for a browser to become available
    return new Promise<Browser>((resolve, reject) => {
      const checkInterval = setInterval(() => {
        for (const instance of this.pool) {
          if (!instance.inUse && instance.browser.isConnected()) {
            clearInterval(checkInterval);
            instance.inUse = true;
            instance.lastUsed = new Date();
            resolve(instance.browser);
            return;
          }
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for available browser'));
      }, 10000);
    });
  }

  releaseBrowser(browser: Browser): void {
    const instance = this.pool.find(inst => inst.browser === browser);
    if (instance) {
      instance.inUse = false;
      instance.lastUsed = new Date();
    }
  }

  private async cleanupIdleBrowsers(): Promise<void> {
    const now = new Date();
    const instancesToRemove: BrowserInstance[] = [];

    for (const instance of this.pool) {
      if (!instance.inUse && 
          (now.getTime() - instance.lastUsed.getTime()) > this.idleTimeout) {
        instancesToRemove.push(instance);
      }
    }

    for (const instance of instancesToRemove) {
      try {
        if (instance.browser.isConnected()) {
          await instance.browser.close();
        }
        const index = this.pool.indexOf(instance);
        this.pool.splice(index, 1);
        console.log('Cleaned up idle browser instance');
      } catch (error) {
        console.error('Error cleaning up browser instance:', error);
      }
    }
  }

  async closeAll(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const closePromises = this.pool.map(async (instance) => {
      try {
        if (instance.browser.isConnected()) {
          await instance.browser.close();
        }
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    });

    await Promise.all(closePromises);
    this.pool = [];
  }

  getPoolStatus(): { total: number; inUse: number; available: number } {
    const inUse = this.pool.filter(inst => inst.inUse).length;
    return {
      total: this.pool.length,
      inUse,
      available: this.pool.length - inUse
    };
  }
}

// Singleton instance
export const browserPool = new BrowserPool();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing browser pool...');
  await browserPool.closeAll();
});

process.on('SIGINT', async () => {
  console.log('Closing browser pool...');
  await browserPool.closeAll();
});