import { Page } from 'puppeteer';
import { puppeteerService } from './puppeteer.service';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

export interface ExtractedChapter {
  title: string;
  content: string;
  nextChapterUrl: string | null;
  originalUrl: string;
}

const isPrivateIP = (ip: string) => {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  
  if (parts[0] === '10' || parts[0] === '127' || parts[0] === '0') return true;
  if (parts[0] === '192' && parts[1] === '168') return true;
  if (parts[0] === '172') {
    const second = parseInt(parts[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
};

const validateUrlSecurity = async (urlStr: string): Promise<boolean> => {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    
    const { address } = await lookup(parsed.hostname);
    if (isPrivateIP(address)) {
      return false;
    }
    
    return true;
  } catch (err) {
    return false;
  }
};

export class ExtractorService {
  async extractChapter(url: string): Promise<ExtractedChapter> {
    if (!(await validateUrlSecurity(url))) {
      throw new Error('Invalid or unsupported URL. Only public HTTP/HTTPS URLs are allowed.');
    }

    const page = await puppeteerService.getPage();

    try {
      // Block images, stylesheets, and fonts to speed up loading
      await page.setRequestInterception(true);
      page.on('request', async (req) => {
        const reqUrl = req.url();
        const resourceType = req.resourceType();

        // SSRF protection for redirects/navigations
        if (req.isNavigationRequest()) {
          const isSafe = await validateUrlSecurity(reqUrl);
          if (!isSafe) {
            req.abort('accessdenied');
            return;
          }
        }

        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Extract Chapter Title
      const title = await page.evaluate(() => {
        // Look for h1 or other common title selectors
        const h1 = document.querySelector('h1');
        if (h1) return h1.innerText.trim();
        const titleTag = document.querySelector('title');
        return titleTag ? titleTag.innerText.trim() : 'Unknown Title';
      });

      // Extract Chapter Content
      const content = await page.evaluate(() => {
        // This is a complex heuristic. For a real production app, we would use Readability.js
        // Here we attempt to find the largest text block and remove junk.
        
        // Remove junk elements first
        const selectorsToRemove = [
          'nav', 'footer', 'header', 'aside', '.sidebar', '.comments', 
          'script', 'style', 'noscript', 'iframe', '.ad', '.ads', 
          '.social-share', '.related-posts'
        ];
        
        selectorsToRemove.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Try to find the main content div. Often it has 'content', 'chapter', 'reading' in its id/class
        let contentEl = document.querySelector('.chapter-content, #chapter-content, .reading-content, article');
        
        if (!contentEl) {
          // Fallback: finding the div with the most paragraphs
          const divs = Array.from(document.querySelectorAll('div'));
          let maxPCount = 0;
          divs.forEach(div => {
            const pCount = div.querySelectorAll('p').length;
            if (pCount > maxPCount) {
              maxPCount = pCount;
              contentEl = div;
            }
          });
        }

        if (!contentEl) {
           return document.body.innerText.trim();
        }

        // Only get text from paragraphs inside the content element, or just text nodes
        const paragraphs = Array.from(contentEl.querySelectorAll('p'));
        if (paragraphs.length > 0) {
           return paragraphs.map(p => p.innerText.trim()).filter(p => p.length > 0).join('\n\n');
        }

        return (contentEl as HTMLElement).innerText.trim();
      });

      // Extract Next Chapter URL
      const nextChapterUrl = await page.evaluate((currentUrl) => {
        const links = Array.from(document.querySelectorAll('a'));
        
        // Keywords that usually indicate a "Next" button
        const nextKeywords = ['next', 'next chapter', 'continue', '>>', 'next page'];
        
        for (const link of links) {
          const text = link.innerText.toLowerCase().trim();
          if (nextKeywords.some(keyword => text.includes(keyword))) {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !href.includes('javascript:')) {
               // Resolve relative URLs using current document base
               try {
                  return new URL(href, currentUrl).href;
               } catch (e) {
                  return href; // Fallback
               }
            }
          }
        }
        return null;
      }, url);

      return {
        title,
        content,
        nextChapterUrl,
        originalUrl: url
      };

    } finally {
      await page.close();
    }
  }
}

export const extractorService = new ExtractorService();
