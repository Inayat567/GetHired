import path from 'path';
import fs from 'fs';

export function getSessionDir(): string {
  return path.resolve('./linkedin-session');
}

export function isLinkedInConnected(): boolean {
  const sessionDir = getSessionDir();
  const infoPath = path.join(sessionDir, 'session_info.json');
  if (fs.existsSync(infoPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
      return !!data.connected;
    } catch {
      return false;
    }
  }

  // Fallback: check if Chromium profile Default folder has cookies
  const defaultDir = path.join(sessionDir, 'Default');
  return fs.existsSync(defaultDir);
}

export function disconnectLinkedIn(): boolean {
  const sessionDir = getSessionDir();
  if (fs.existsSync(sessionDir)) {
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      return true;
    } catch (err) {
      console.error('[LinkedIn] Error removing session dir:', err);
      return false;
    }
  }
  return true;
}

export function isHeadlessCloudEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || (!process.env.DISPLAY && process.platform === 'linux');
}

export async function connectLinkedInSession(): Promise<{ success: boolean; message: string }> {
  if (isHeadlessCloudEnvironment()) {
    return {
      success: false,
      message:
        'Interactive LinkedIn login requires a local desktop display (localhost). On the cloud/web, LinkedIn jobs are automatically discovered via the built-in Public LinkedIn Guest Engine without requiring personal login.',
    };
  }

  let playwright;
  try {
    playwright = require('playwright');
  } catch {
    return {
      success: false,
      message: 'Playwright is not installed or available on this system.',
    };
  }

  const sessionDir = getSessionDir();
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  console.log('🌐 Opening browser for LinkedIn authentication...');
  console.log('📁 Using profile storage at:', sessionDir);

  let context: any = null;
  try {
    const launchOptions: any = {
      headless: false,
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    };

    try {
      context = await playwright.chromium.launchPersistentContext(sessionDir, launchOptions);
    } catch (launchErr: any) {
      // If bundled chromium isn't found, try system installed Google Chrome
      if (launchErr.message && launchErr.message.includes("Executable doesn't exist")) {
        console.log('🔄 Bundled Chromium missing, attempting with installed system Chrome...');
        context = await playwright.chromium.launchPersistentContext(sessionDir, {
          ...launchOptions,
          channel: 'chrome',
        });
      } else {
        throw launchErr;
      }
    }

    const page = await context.newPage();
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });

    console.log('👉 Waiting for user to complete login on LinkedIn...');

    return await new Promise((resolve) => {
      let isResolved = false;
      let checkInterval: NodeJS.Timeout | null = null;
      let timeoutHandle: NodeJS.Timeout | null = null;

      const finish = async (success: boolean, message: string) => {
        if (isResolved) return;
        isResolved = true;
        if (checkInterval) clearInterval(checkInterval);
        if (timeoutHandle) clearTimeout(timeoutHandle);

        try {
          if (context) {
            await context.close();
          }
        } catch {
          // Ignore context close errors
        }

        resolve({ success, message });
      };

      // Poll every 1.5 seconds to see if authentication succeeded
      checkInterval = setInterval(async () => {
        try {
          if (page.isClosed()) {
            // User closed the window manually
            const cookies = await context.cookies().catch(() => []);
            const hasLiAt = cookies.some((c: any) => c.name === 'li_at');
            if (hasLiAt) {
              const infoPath = path.join(sessionDir, 'session_info.json');
              fs.writeFileSync(
                infoPath,
                JSON.stringify({ connected: true, connectedAt: new Date().toISOString() }, null, 2)
              );
              return finish(true, 'LinkedIn connected successfully!');
            }
            return finish(false, 'Login window closed before authentication completed.');
          }

          const currentUrl = page.url();
          const cookies = await context.cookies().catch(() => []);
          const hasLiAt = cookies.some((c: any) => c.name === 'li_at');

          // If li_at cookie is present or navigated to feed / jobs / network
          if (
            hasLiAt ||
            currentUrl.includes('/feed') ||
            currentUrl.includes('/mynetwork') ||
            (currentUrl.includes('linkedin.com') && !currentUrl.includes('/login') && !currentUrl.includes('/checkpoint'))
          ) {
            console.log('✅ Authentication detected! Saving session state...');

            // Wait 2.5 seconds to let session cookies settle and flush to disk
            await new Promise((r) => setTimeout(r, 2500));

            const infoPath = path.join(sessionDir, 'session_info.json');
            fs.writeFileSync(
              infoPath,
              JSON.stringify({ connected: true, connectedAt: new Date().toISOString() }, null, 2)
            );

            return finish(true, 'LinkedIn connected successfully! Browser closed automatically.');
          }
        } catch (err: any) {
          // If page was closed during check
          if (err.message && err.message.includes('Target closed')) {
            const cookies = await context.cookies().catch(() => []);
            const hasLiAt = cookies.some((c: any) => c.name === 'li_at');
            if (hasLiAt) {
              return finish(true, 'LinkedIn connected successfully!');
            }
            return finish(false, 'Browser window was closed.');
          }
        }
      }, 1500);

      // Timeout after 3 minutes
      timeoutHandle = setTimeout(() => {
        finish(false, 'LinkedIn connection timed out after 3 minutes.');
      }, 180000);
    });
  } catch (err: any) {
    if (context) await context.close().catch(() => {});
    return {
      success: false,
      message: `Failed to launch browser: ${err.message}`,
    };
  }
}

// CLI runner support when executed directly
if (require.main === module) {
  connectLinkedInSession().then((res) => {
    console.log(res.message);
    process.exit(res.success ? 0 : 1);
  });
}
