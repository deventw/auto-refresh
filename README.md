# auto-refresh

Automatically detect and prompt for page updates by monitoring script changes.

自動檢測並提示頁面更新，通過監控腳本變化。

## Installation

```bash
npm install auto-refresh
```

## Where to Use

Import and call `autoRefresh()` in your application's entry point to start monitoring for updates. Here are common locations:

### React / Vite

**In `src/main.tsx` or `src/index.tsx`:**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { autoRefresh } from 'auto-refresh'

// Start auto-refresh
autoRefresh()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### Vanilla JavaScript / TypeScript

**In `src/main.ts` or `src/index.ts`:**

```typescript
import { autoRefresh } from 'auto-refresh'

// Start auto-refresh
autoRefresh()

// Your app initialization code here
```

### Vue

**In `src/main.ts`:**

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import { autoRefresh } from 'auto-refresh'

// Start auto-refresh
autoRefresh()

createApp(App).mount('#app')
```

### Angular

**In `src/main.ts`:**

```typescript
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { AppModule } from './app/app.module'
import { autoRefresh } from 'auto-refresh'

// Start auto-refresh
autoRefresh()

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err))
```

**Or with standalone components (Angular 14+):**

```typescript
import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app/app.component'
import { autoRefresh } from 'auto-refresh'

// Start auto-refresh
autoRefresh()

bootstrapApplication(AppComponent)
  .catch(err => console.error(err))
```

### Svelte

**In `src/main.ts`:**

```typescript
import App from './App.svelte'
import { autoRefresh } from 'auto-refresh'

// Start auto-refresh
autoRefresh()

const app = new App({
  target: document.getElementById('app')!,
})

export default app
```

**Or with SvelteKit:**

```typescript
// In src/app.html or src/routes/+layout.svelte
import { onMount } from 'svelte'
import { autoRefresh } from 'auto-refresh'

onMount(() => {
  autoRefresh()
})
```

> **Note:** Call `autoRefresh()` once when your app initializes. It will run in the background and check for updates automatically.

## Framework Compatibility

✅ **Works with React, Vue, Angular, Svelte, and any JavaScript framework!**

This package is **framework-agnostic** - it only uses standard browser APIs (`fetch`, `location.reload`, `setTimeout`). It works with any framework or vanilla JavaScript.

### Important Notes

**Production Builds:**

- Works perfectly with bundlers like Vite, Webpack, Rollup, etc.
- When you rebuild your app, bundlers add content hashes to filenames (e.g., `app-abc123.js` → `app-xyz789.js`)
- The package detects these filename changes and prompts users to refresh
- **Perfect for production deployments!** 🚀

**Development Mode:**

- In development, Hot Module Replacement (HMR) already handles updates
- You can still use this package, but it's most useful in production
- Consider disabling in development or using a longer `duration` interval

**SPA Routing:**

- Works with client-side routing (React Router, Vue Router, etc.)
- The package checks the HTML from the server, not the client-side route
- Make sure your server returns the same HTML for all routes (typical SPA setup)

### Example: Enable Only in Production

```typescript
import { autoRefresh } from 'auto-refresh'

// Only enable in production
if (import.meta.env.PROD) { // Vite
  // or: if (process.env.NODE_ENV === 'production') { // Webpack/CRA
  autoRefresh()
}
```

## Usage

### Basic Usage

**If you never want to stop** (most common):

```typescript
import { autoRefresh } from 'auto-refresh';

// Start auto-refresh - it will run forever
autoRefresh();
```

**If you want to stop it later**:

```typescript
import { autoRefresh } from 'auto-refresh';

// Store the stop function
const stop = autoRefresh();

// Later, when you want to stop:
stop();
```

### With Custom Options

```typescript
import { autoRefresh } from 'auto-refresh';

const stop = autoRefresh({
  duration: 5000, // Check every 5 seconds
  message: 'New version available! Click OK to refresh.',
  checkUrl: '/', // Custom URL to check
  onUpdateDetected: () => {
    console.log('Update detected!');
  },
  onBeforeReload: () => {
    console.log('Reloading page...');
  },
});
```

### Custom Regex Pattern

You can customize the regex pattern to match different tags or attributes:

```typescript
import { autoRefresh } from 'auto-refresh';

// Monitor CSS link tags instead of scripts
autoRefresh({
  pattern: /<link.*href=["']([^"']+\.css[^"']*)/gm,
});

// Monitor both scripts and stylesheets
autoRefresh({
  pattern: /<(?:script|link).*(?:src|href)=["']([^"']+)/gm,
});

// Custom pattern for specific script files
autoRefresh({
  pattern: /<script.*src=["']([^"']*app[^"']*\.js)/gm,
});
```

### Manual Update Check

```typescript
import { needUpdate, extractNewScripts } from 'auto-refresh';

// Check if update is needed
const hasUpdate = await needUpdate();

// Extract script sources manually
const scripts = await extractNewScripts('/');
```

## API

### `autoRefresh(options?: AutoRefreshOptions): () => void`

Starts the auto-refresh process. Returns a function to stop the auto-refresh (optional - if you never call it, it will run forever).

**Options:**

- `duration?: number` - Check interval in milliseconds (default: 2000)
- `message?: string` - Custom message to show when update is detected
- `checkUrl?: string` - Custom URL to fetch for checking updates (default: current page)
- `pattern?: RegExp` - Custom regex pattern to match script/link tags (default: matches `<script src="...">`)
- `onUpdateDetected?: () => void` - Callback when update is detected
- `onBeforeReload?: () => void` - Callback before page reload

### `needUpdate(checkUrl?: string, pattern?: RegExp): Promise<boolean>`

Checks if an update is needed by comparing script sources.

### `extractNewScripts(checkUrl?: string, pattern?: RegExp): Promise<string[]>`

Extracts script source URLs from the specified page using the provided regex pattern.

## How It Works

1. Fetches the HTML of the current page (or specified URL) with a timestamp to bypass cache
2. Extracts matching tags from the HTML using the regex pattern (default: `<script src="...">` tags)
3. Compares the extracted sources with the previous check
4. If changes are detected, prompts the user to refresh
5. Reloads the page if the user confirms

## License

MIT
