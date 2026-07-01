import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';

puppeteer.use(StealthPlugin());

class PuppeteerService {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      console.log('Puppeteer browser instance initialized.');
    }
  }

  async getPage(): Promise<Page> {
    if (!this.browser) {
      await this.init();
    }
    return await this.browser!.newPage();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('Puppeteer browser instance closed.');
    }
  }
}

export const puppeteerService = new PuppeteerService();
