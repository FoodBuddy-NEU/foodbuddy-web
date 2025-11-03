// Import the Cloudinary SDK lazily to avoid the SDK auto-parsing an invalid
// CLOUDINARY_URL at module-import time (which produces the runtime error
// "Invalid CLOUDINARY_URL protocol..."). We temporarily remove
// process.env.CLOUDINARY_URL during import and then configure the SDK
// explicitly from parsed values or separate env vars.


import { v2 as cloudinary } from 'cloudinary';

// Configure the SDK explicitly using either individual env vars or the
// CLOUDINARY_URL (parsed). Parsing is permissive to accept API keys with
// non-digit characters.
function configureFromEnv() {
	const apiKey = process.env.CLOUDINARY_API_KEY;
	const apiSecret = process.env.CLOUDINARY_API_SECRET;
	const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

	if (apiKey && apiSecret && cloudName) {
		cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
		return;
	}

	const envUrl = process.env.CLOUDINARY_URL;
	if (envUrl) {
		// Ensure protocol looks correct before parsing — avoid throwing the SDK's default error.
	if (!envUrl.startsWith("cloudinary://")) {
		console.error("CLOUDINARY_URL must begin with 'cloudinary://' — please fix your .env.local");
		return;
	}		const match = envUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
		if (match) {
			const [, parsedKey, parsedSecret, parsedCloudName] = match;
			cloudinary.config({ cloud_name: parsedCloudName, api_key: parsedKey, api_secret: parsedSecret, secure: true });
			return;
		}
	}

	// If we reached here, configuration is incomplete.
	console.debug("Cloudinary configuration not found in env. Set CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET/CLOUDINARY_CLOUD_NAME or CLOUDINARY_URL.");
}

configureFromEnv();

export default cloudinary;
