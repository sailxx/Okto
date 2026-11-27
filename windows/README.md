# Google sign-in for Okto Tray

Install Okto Tray and choose **Sign in in your browser**, then **Continue with Google**. The public installer uses the Okto site's Firebase Google provider. It sends the Google identity token to the running tray over a single-use loopback request, and the tray stores the resulting Firebase session in its WebView2 profile.

## Optional Desktop OAuth configuration

1. Register a **Desktop app** OAuth client for Okto in Google Auth Platform. Allow that client ID in the Firebase Google sign-in provider.
2. Set the repository variable `GOOGLE_DESKTOP_CLIENT_ID` to the public client ID. Deploy the Okto web app with the GitHub Pages workflow. For a local web build, use `VITE_GOOGLE_DESKTOP_CLIENT_ID`.
3. Save the downloaded Desktop client configuration as `%LOCALAPPDATA%\OktoTray\google-desktop.json`. Keep the JSON out of the website, installer and repository.
4. Build and install Okto Tray with `windows/build-setup.ps1`. From the tray popup, choose **Sign in in your browser**, then **Continue with Google** in the Okto dialog.

The tray opens a loopback listener for three minutes and validates the OAuth state and PKCE response. Firebase saves the resulting session in the existing WebView2 profile. Later updates can use that same profile.

[Google OAuth for desktop apps](https://developers.google.com/identity/protocols/oauth2/native-app) · [Google provider configuration](https://docs.cloud.google.com/identity-platform/docs/web/google)
