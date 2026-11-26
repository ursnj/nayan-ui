# Nayan UI starter

A shared landing screen runs in Vite on the web and Expo on iOS and Android. This standalone Bun workspace uses `nayan-ui@1.0.0-beta.5` from npm and declares its `react-reconciler` peer dependency once for both apps. You can copy this directory into a new project and run the same commands.

## Run on the web

Use the Bun channel in [.bun-version](.bun-version). From this directory, install the dependencies and start Vite.

```sh
bun install --frozen-lockfile
bun run web
```

Open http://127.0.0.1:5173.

## Run on iOS or Android

Install the platform SDK and use an Expo development build. The npm package includes the native engine libraries.

```sh
bun run ios
# Or, for Android
bun run android
```

After installing the development build, you can start Metro with `bun run mobile` and open the installed app on your simulator or device. The [Expo config](mobile/app.json) registers the Nayan UI plugin and targets Android API 26 or newer.

## Customize the landing page

- The shared landing page uses Nayan UI’s built-in utilities. Nayan UI compiles them to CSS for the browser and resolves them at runtime on mobile. [Landing.tsx](shared/src/Landing.tsx)
- Edit the light and dark palettes to theme surfaces, controls, fields, links, focus states, and status colors on all platforms. Both apps pass these palettes to `NTheme`, and the web build generates CSS variables from them for utilities like `bg-surface` and `text-accent-foreground`. The theme follows the system on first launch and saves the selected mode through `nayan-ui/storage`. [theme.ts](shared/src/theme.ts)
- [web/src/main.tsx](web/src/main.tsx) uses `NTheme` and `NPlatformView` to render the landing page as browser HTML.
- The mobile entry registers the landing page directly with Expo. `NTheme` provides the root theme and safe-area handling. [mobile/src/main.tsx](mobile/src/main.tsx)

Run `bun run typecheck` to check both apps and `bun run web:build` to create the web build in `web/dist`.
