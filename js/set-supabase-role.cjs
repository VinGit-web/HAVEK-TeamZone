
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp();

async function assignSupabaseRole() {
    const auth = getAuth();

    let nextPageToken;

    do {
        const result = await auth.listUsers(1000, nextPageToken);

        for (const user of result.users) {
            const existingClaims = user.customClaims || {};

            await auth.setCustomUserClaims(user.uid, {
                ...existingClaims,
                role: "authenticated"
            });

            console.log("Updated account:", user.uid);
        }

        nextPageToken = result.pageToken;

    } while (nextPageToken);

    console.log("Finished assigning Supabase roles.");
}

assignSupabaseRole().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
