
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const fs = require("node:fs");

async function main() {
  const email = process.argv[2];
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!email || !credentialPath) {
    throw new Error(
      "An account email and credential path are required."
    );
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(credentialPath, "utf8")
  );

  initializeApp({
    credential: cert(serviceAccount)
  });

  const auth = getAuth();
  const user = await auth.getUserByEmail(email);

  const existingClaims = user.customClaims || {};

  if (
    existingClaims.role &&
    existingClaims.role !== "authenticated"
  ) {
    throw new Error(
      "The account already has a different role."
    );
  }

  await auth.setCustomUserClaims(user.uid, {
    ...existingClaims,
    role: "authenticated"
  });

  const updated = await auth.getUser(user.uid);

  console.log("Success");
  console.log("Firebase UID:", updated.uid);
  console.log("Role:", updated.customClaims?.role);
}

main().catch(error => {
  console.error("Error:", error.message);
  process.exitCode = 1;
});
