import fetch from 'node-fetch';
import { loggingProvider } from '../logger';

// This function runs itself immediately when imported
(() => {
    // Check the convar we just added in build.js
    if (GetConvarInt('mysql_versioncheck', 1) === 0) return;

    const resourceName = GetCurrentResourceName();
    // Get the version from the manifest (which we now set at build time)
    const currentVersion = GetResourceMetadata(resourceName, 'version', 0);

    if (!currentVersion) return;

    setTimeout(async () => {
        try {
            const response = await fetch(`https://api.github.com/repos/kjmaster1/kjmysql/releases/latest`);

            if (response?.status !== 200) return;

            const release = (await response.json()) as any;
            if (release.prerelease) return;

            const latestVersion = release.tag_name.replace('v', '');

            if (currentVersion !== latestVersion) {
                loggingProvider.log(`^3An update is available for ${resourceName} (current: ${currentVersion} | latest: ${latestVersion})^0`);
                loggingProvider.log(`^3Download from: ${release.html_url}^0`);
            }
        } catch (err: any) {
            loggingProvider.warn(`[^3${resourceName}^0] Failed to check for updates.`);
        }
    }, 1000);
})();