import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/env';

interface CacheEntry {
  buffer: Buffer;
  createdAt: Date;
  jobUpdatedAt: string;
}

class PDFCache {
  private cacheDir: string;
  private maxAge: number; // in milliseconds
  private memoryCache: Map<string, CacheEntry> = new Map();
  private maxMemoryEntries = 50; // Keep up to 50 PDFs in memory

  constructor() {
    this.cacheDir = config.PDF_CACHE_DIR;
    this.maxAge = 15 * 60 * 1000; // 15 minutes
    this.ensureCacheDir();
    this.startCleanupInterval();
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  private generateCacheKey(jobId: number, showLinePricing: boolean, jobUpdatedAt: string): string {
    const key = `job_${jobId}_pricing_${showLinePricing}_updated_${jobUpdatedAt}`;
    const hash = crypto.createHash('md5').update(key).digest('hex');
    // Include jobId in filename for easy invalidation
    return `job_${jobId}_${hash}`;
  }

  private getFilePath(cacheKey: string): string {
    return path.join(this.cacheDir, `${cacheKey}.pdf`);
  }

  async get(jobId: number, showLinePricing: boolean, jobUpdatedAt: string): Promise<Buffer | null> {
    const cacheKey = this.generateCacheKey(jobId, showLinePricing, jobUpdatedAt);
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && this.isValidEntry(memoryEntry, jobUpdatedAt)) {
      return memoryEntry.buffer;
    }

    // Check file cache
    try {
      const filePath = this.getFilePath(cacheKey);
      const stats = await fs.stat(filePath);
      
      // Check if file is still valid
      if (Date.now() - stats.mtime.getTime() < this.maxAge) {
        const buffer = await fs.readFile(filePath);
        
        // Store in memory cache
        this.addToMemoryCache(cacheKey, {
          buffer,
          createdAt: stats.mtime,
          jobUpdatedAt
        });
        
        return buffer;
      } else {
        // File is expired, delete it
        await fs.unlink(filePath).catch(() => {}); // Ignore errors
      }
    } catch (error) {
      // File doesn't exist or can't be read
    }

    return null;
  }

  async set(jobId: number, showLinePricing: boolean, jobUpdatedAt: string, buffer: Buffer): Promise<void> {
    const cacheKey = this.generateCacheKey(jobId, showLinePricing, jobUpdatedAt);
    const filePath = this.getFilePath(cacheKey);
    
    try {
      // Store in file cache
      await fs.writeFile(filePath, buffer);
      
      // Store in memory cache
      this.addToMemoryCache(cacheKey, {
        buffer,
        createdAt: new Date(),
        jobUpdatedAt
      });
      
      console.log(`PDF cached for job ${jobId}, pricing: ${showLinePricing}`);
    } catch (error) {
      console.error('Failed to cache PDF:', error);
    }
  }

  private addToMemoryCache(key: string, entry: CacheEntry): void {
    // Remove oldest entries if we're at capacity
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }
    
    this.memoryCache.set(key, entry);
  }

  private isValidEntry(entry: CacheEntry, jobUpdatedAt: string): boolean {
    // Check if entry is still fresh and job hasn't been updated
    const age = Date.now() - entry.createdAt.getTime();
    return age < this.maxAge && entry.jobUpdatedAt === jobUpdatedAt;
  }

  async invalidateJob(jobId: number): Promise<void> {
    try {
      // Remove from memory cache - keys now include readable jobId
      const keysToRemove = Array.from(this.memoryCache.keys())
        .filter(key => {
          // Extract jobId from cache key (format: job_123_hashvalue)
          const match = key.match(/^job_(\d+)_/);
          return match && parseInt(match[1]) === jobId;
        });
      
      for (const key of keysToRemove) {
        this.memoryCache.delete(key);
      }

      // Remove from file cache - filenames now include readable jobId
      const files = await fs.readdir(this.cacheDir);
      const jobFiles = files.filter(file => {
        // Extract jobId from filename (format: job_123_hashvalue.pdf)
        const match = file.match(/^job_(\d+)_.*\.pdf$/);
        return match && parseInt(match[1]) === jobId;
      });
      
      await Promise.all(
        jobFiles.map(file => 
          fs.unlink(path.join(this.cacheDir, file)).catch(() => {})
        )
      );
      
      console.log(`Invalidated cache for job ${jobId}`);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // Remove all files from file cache
      const files = await fs.readdir(this.cacheDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf'));
      
      await Promise.all(
        pdfFiles.map(file => 
          fs.unlink(path.join(this.cacheDir, file)).catch(() => {})
        )
      );
      
      console.log(`Cleared all PDF cache (${pdfFiles.length} files removed)`);
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  private startCleanupInterval(): void {
    // Clean up every 30 minutes
    setInterval(async () => {
      await this.cleanup();
    }, 30 * 60 * 1000);
  }

  private async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        try {
          const stats = await fs.stat(filePath);
          if (now - stats.mtime.getTime() > this.maxAge) {
            await fs.unlink(filePath);
          }
        } catch (error) {
          // File might have been deleted already, ignore
        }
      }
      
      // Clean up memory cache
      const expiredKeys = Array.from(this.memoryCache.entries())
        .filter(([key, entry]) => now - entry.createdAt.getTime() > this.maxAge)
        .map(([key]) => key);
      
      for (const key of expiredKeys) {
        this.memoryCache.delete(key);
      }
      
      if (expiredKeys.length > 0) {
        console.log(`Cleaned up ${expiredKeys.length} expired cache entries`);
      }
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }

  getStats(): { memoryEntries: number; totalMemorySize: number } {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.buffer.length;
    }
    
    return {
      memoryEntries: this.memoryCache.size,
      totalMemorySize: totalSize
    };
  }
}

// Singleton instance
export const pdfCache = new PDFCache();