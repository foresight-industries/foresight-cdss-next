// Bot detection avoidance strategies for CoverMyMeds portal automation
export interface BotAvoidanceConfig {
  enabled: boolean;
  mouseMovements: boolean;
  randomDelays: boolean;
  delayRange: [number, number]; // [min, max] in milliseconds
  userAgentRotation: boolean;
  viewportVariation: boolean;
  scrollingBehavior: boolean;
  cookieManagement: boolean;
  sessionPersistence: boolean;
  humanLikeTyping: boolean;
  clickPatterns: boolean;
  breakPatterns: boolean;
}

export interface BrowserInstance {
  // Mock browser interface - would be actual Browserbase browser instance
  page: {
    goto: (url: string) => Promise<void>;
    fill: (selector: string, value: string) => Promise<void>;
    click: (selector: string) => Promise<void>;
    type: (selector: string, text: string, options?: any) => Promise<void>;
    mouse: {
      move: (x: number, y: number) => Promise<void>;
      click: (x: number, y: number) => Promise<void>;
    };
    keyboard: {
      press: (key: string, options?: any) => Promise<void>;
      type: (text: string, options?: any) => Promise<void>;
    };
    setViewportSize: (size: { width: number; height: number }) => Promise<void>;
    evaluate: (fn: Function, ...args: any[]) => Promise<any>;
    waitForTimeout: (timeout: number) => Promise<void>;
    screenshot: (options?: any) => Promise<Buffer>;
  };
  context: {
    setUserAgent: (userAgent: string) => Promise<void>;
  };
}

export class BotAvoidanceService {
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
  ];

  private readonly viewportSizes = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 }
  ];

  private readonly sessionState = new Map<string, {
    userAgent: string;
    viewport: { width: number; height: number };
    sessionStart: number;
    actionCount: number;
    lastActivity: number;
  }>();

  async initializeSession(
    browser: BrowserInstance,
    sessionId: string,
    config: BotAvoidanceConfig
  ): Promise<void> {
    if (!config.enabled) return;

    const userAgent = config.userAgentRotation ?
      this.getRandomUserAgent() :
      this.userAgents[0];

    const viewport = config.viewportVariation ?
      this.getRandomViewport() :
      this.viewportSizes[0];

    // Set user agent
    await browser.context.setUserAgent(userAgent);

    // Set viewport
    await browser.page.setViewportSize(viewport);

    // Store session state
    this.sessionState.set(sessionId, {
      userAgent,
      viewport,
      sessionStart: Date.now(),
      actionCount: 0,
      lastActivity: Date.now()
    });

    // Initialize human-like browsing patterns
    if (config.cookieManagement) {
      await this.setCookieConsent(browser);
    }
  }

  async navigateWithAvoidance(
    browser: BrowserInstance,
    sessionId: string,
    url: string,
    config: BotAvoidanceConfig
  ): Promise<void> {
    await this.updateActivity(sessionId);

    if (config.randomDelays) {
      await this.randomDelay(config.delayRange);
    }

    // Navigate with human-like patterns
    await browser.page.goto(url);

    if (config.scrollingBehavior) {
      await this.humanLikeScroll(browser);
    }

    // Random mouse movement after navigation
    if (config.mouseMovements) {
      await this.randomMouseMovement(browser);
    }
  }

  async fillWithAvoidance(
    browser: BrowserInstance,
    sessionId: string,
    selector: string,
    value: string,
    config: BotAvoidanceConfig
  ): Promise<void> {
    await this.updateActivity(sessionId);

    if (config.randomDelays) {
      await this.randomDelay([100, 500]);
    }

    // Click field first with human-like behavior
    if (config.clickPatterns) {
      await this.humanLikeClick(browser, selector);
    } else {
      await browser.page.click(selector);
    }

    // Small delay before typing
    await this.randomDelay([50, 200]);

    // Type with human-like patterns
    if (config.humanLikeTyping) {
      await this.humanLikeType(browser, value);
    } else {
      await browser.page.fill(selector, value);
    }

    // Random mouse movement after typing
    if (config.mouseMovements) {
      await this.randomMouseMovement(browser, { small: true });
    }
  }

  async clickWithAvoidance(
    browser: BrowserInstance,
    sessionId: string,
    selector: string,
    config: BotAvoidanceConfig
  ): Promise<void> {
    await this.updateActivity(sessionId);

    if (config.randomDelays) {
      await this.randomDelay(config.delayRange);
    }

    // Pre-click mouse movement
    if (config.mouseMovements) {
      await this.randomMouseMovement(browser, { small: true });
    }

    // Human-like click
    if (config.clickPatterns) {
      await this.humanLikeClick(browser, selector);
    } else {
      await browser.page.click(selector);
    }

    // Post-click delay
    await this.randomDelay([100, 300]);
  }

  async waitWithAvoidance(
    browser: BrowserInstance,
    sessionId: string,
    baseTimeout: number,
    config: BotAvoidanceConfig
  ): Promise<void> {
    await this.updateActivity(sessionId);

    let timeout = baseTimeout;

    // Add randomness to wait times
    if (config.randomDelays) {
      const variance = baseTimeout * 0.2; // 20% variance
      timeout = baseTimeout + (Math.random() - 0.5) * variance;
    }

    await browser.page.waitForTimeout(Math.max(100, timeout));

    // Occasional human-like activity during waits
    if (config.mouseMovements && Math.random() < 0.3) {
      await this.randomMouseMovement(browser, { small: true });
    }
  }

  async takeBreakIfNeeded(
    browser: BrowserInstance,
    sessionId: string,
    config: BotAvoidanceConfig
  ): Promise<void> {
    if (!config.breakPatterns) return;

    const sessionState = this.sessionState.get(sessionId);
    if (!sessionState) return;

    const sessionDuration = Date.now() - sessionState.sessionStart;
    const actionCount = sessionState.actionCount;

    // Take breaks based on patterns
    let shouldBreak = false;
    let breakDuration = 0;

    // Break after 15-20 minutes
    if (sessionDuration > 15 * 60 * 1000 && actionCount > 50) {
      shouldBreak = true;
      breakDuration = this.getRandomInt(30000, 60000); // 30-60 seconds
    }
    // Break after many actions
    else if (actionCount > 100 && actionCount % 25 === 0) {
      shouldBreak = true;
      breakDuration = this.getRandomInt(5000, 15000); // 5-15 seconds
    }
    // Random micro-breaks
    else if (Math.random() < 0.05) { // 5% chance
      shouldBreak = true;
      breakDuration = this.getRandomInt(2000, 5000); // 2-5 seconds
    }

    if (shouldBreak) {
      console.log(`Taking ${breakDuration}ms break for human-like behavior`);

      // During break, do human-like activities
      if (config.mouseMovements) {
        await this.randomMouseMovement(browser);
      }

      if (config.scrollingBehavior && Math.random() < 0.5) {
        await this.randomScroll(browser);
      }

      await browser.page.waitForTimeout(breakDuration);
    }
  }

  private async humanLikeType(browser: BrowserInstance, text: string): Promise<void> {
    // Clear field first
    await browser.page.keyboard.press('Control+A');
    await browser.page.keyboard.press('Delete');

    // Type with human-like timing
    for (const char of text) {
      await browser.page.keyboard.type(char, {
        delay: this.getRandomInt(50, 150) // Human typing speed variation
      });

      // Occasional brief pauses (thinking)
      if (Math.random() < 0.1) {
        await browser.page.waitForTimeout(this.getRandomInt(200, 500));
      }

      // Occasional typo simulation (backspace)
      if (Math.random() < 0.02) {
        await browser.page.keyboard.press('Backspace');
        await browser.page.waitForTimeout(this.getRandomInt(100, 300));
        await browser.page.keyboard.type(char);
      }
    }
  }

  private async humanLikeClick(browser: BrowserInstance, selector: string): Promise<void> {
    // Get element bounds to click within it
    const elementBounds = await browser.page.evaluate((sel: string) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
    }, selector);

    if (elementBounds) {
      // Click at a random point within the element (not center)
      const clickX = elementBounds.x + this.getRandomInt(5, elementBounds.width - 5);
      const clickY = elementBounds.y + this.getRandomInt(5, elementBounds.height - 5);

      // Move mouse to target with slight curve
      await this.moveMouseWithCurve(browser, clickX, clickY);

      // Brief pause before click
      await browser.page.waitForTimeout(this.getRandomInt(50, 150));

      // Click with slight timing variation
      await browser.page.mouse.click(clickX, clickY);
    } else {
      // Fallback to standard click
      await browser.page.click(selector);
    }
  }

  private async randomMouseMovement(
    browser: BrowserInstance,
    options: { small?: boolean } = {}
  ): Promise<void> {
    const movements = options.small ? 2 : this.getRandomInt(2, 5);

    for (let i = 0; i < movements; i++) {
      const x = this.getRandomInt(100, 1200);
      const y = this.getRandomInt(100, 700);

      await this.moveMouseWithCurve(browser, x, y);
      await browser.page.waitForTimeout(this.getRandomInt(100, 300));
    }
  }

  private async moveMouseWithCurve(
    browser: BrowserInstance,
    targetX: number,
    targetY: number
  ): Promise<void> {
    // Get current mouse position (simplified - would need actual tracking)
    const currentX = this.getRandomInt(200, 800);
    const currentY = this.getRandomInt(200, 600);

    // Create curved path with 3-5 intermediate points
    const steps = this.getRandomInt(3, 6);

    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;

      // Add bezier curve effect
      const curveX = currentX + (targetX - currentX) * progress +
                    Math.sin(progress * Math.PI) * this.getRandomInt(-20, 20);
      const curveY = currentY + (targetY - currentY) * progress +
                    Math.cos(progress * Math.PI) * this.getRandomInt(-15, 15);

      await browser.page.mouse.move(curveX, curveY);
      await browser.page.waitForTimeout(this.getRandomInt(20, 50));
    }
  }

  private async humanLikeScroll(browser: BrowserInstance): Promise<void> {
    // Simulate reading behavior with scroll patterns
    const scrolls = this.getRandomInt(2, 4);

    for (let i = 0; i < scrolls; i++) {
      const scrollAmount = this.getRandomInt(200, 600);

      await browser.page.evaluate((amount: number) => {
        window.scrollBy({
          top: amount,
          behavior: 'smooth'
        });
      }, scrollAmount);

      // Reading pause
      await browser.page.waitForTimeout(this.getRandomInt(800, 2000));
    }

    // Scroll back up occasionally
    if (Math.random() < 0.3) {
      await browser.page.evaluate(() => {
        window.scrollBy({
          top: -200,
          behavior: 'smooth'
        });
      });
    }
  }

  private async randomScroll(browser: BrowserInstance): Promise<void> {
    const direction = Math.random() < 0.7 ? 1 : -1; // Prefer scrolling down
    const amount = this.getRandomInt(100, 300) * direction;

    await browser.page.evaluate((scrollAmount: number) => {
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }, amount);
  }

  private async setCookieConsent(browser: BrowserInstance): Promise<void> {
    // Handle common cookie consent patterns
    try {
      const cookieSelectors = [
        '[data-testid="cookie-accept"]',
        '#cookie-accept',
        '.cookie-accept',
        'button[aria-label*="Accept"]',
        'button[aria-label*="agree"]'
      ];

      for (const selector of cookieSelectors) {
        try {
          await browser.page.click(selector);
          await browser.page.waitForTimeout(1000);
          break;
        } catch {
          // Selector not found, try next
        }
      }
    } catch {
      // No cookie consent found, continue
    }
  }

  private async randomDelay(range: [number, number]): Promise<void> {
    const delay = this.getRandomInt(range[0], range[1]);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private getRandomViewport(): { width: number; height: number } {
    return this.viewportSizes[Math.floor(Math.random() * this.viewportSizes.length)];
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private async updateActivity(sessionId: string): Promise<void> {
    const sessionState = this.sessionState.get(sessionId);
    if (sessionState) {
      sessionState.actionCount++;
      sessionState.lastActivity = Date.now();
    }
  }

  async cleanupSession(sessionId: string): Promise<void> {
    this.sessionState.delete(sessionId);
  }

  // Circuit breaker for detected bot flags
  async checkBotDetection(browser: BrowserInstance): Promise<{
    detected: boolean;
    signals: string[];
    confidence: number;
  }> {
    const signals: string[] = [];
    let confidence = 0;

    try {
      // Check for CAPTCHA
      const captchaDetected = await browser.page.evaluate(() => {
        const captchaSelectors = [
          '.captcha',
          '#captcha',
          '[class*="recaptcha"]',
          '[data-sitekey]',
          'iframe[src*="recaptcha"]'
        ];

        return captchaSelectors.some(selector =>
          document.querySelector(selector) !== null
        );
      });

      if (captchaDetected) {
        signals.push('captcha_detected');
        confidence += 0.8;
      }

      // Check for rate limiting messages
      const rateLimitDetected = await browser.page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();
        const rateLimitPatterns = [
          'too many requests',
          'rate limit',
          'please try again later',
          'temporarily blocked',
          'suspicious activity'
        ];

        return rateLimitPatterns.some(pattern =>
          pageText.includes(pattern)
        );
      });

      if (rateLimitDetected) {
        signals.push('rate_limit_detected');
        confidence += 0.7;
      }

      // Check for suspicious redirects
      const currentUrl = await browser.page.evaluate(() => window.location.href);
      if (currentUrl.includes('security') || currentUrl.includes('verification')) {
        signals.push('security_redirect');
        confidence += 0.6;
      }

      // Check for human verification requirements
      const humanVerificationDetected = await browser.page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();
        const verificationPatterns = [
          'human verification',
          'verify you are human',
          'prove you are not a robot',
          'complete verification'
        ];

        return verificationPatterns.some(pattern =>
          pageText.includes(pattern)
        );
      });

      if (humanVerificationDetected) {
        signals.push('human_verification_required');
        confidence += 0.9;
      }

    } catch (error) {
      console.error('Error checking bot detection:', error);
    }

    return {
      detected: confidence > 0.5,
      signals,
      confidence: Math.min(confidence, 1.0)
    };
  }
}

export const botAvoidanceService = new BotAvoidanceService();
