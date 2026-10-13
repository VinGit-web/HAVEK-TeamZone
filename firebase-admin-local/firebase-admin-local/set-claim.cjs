
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const serviceAccount = require("./service-account.json");

initializeApp({
  credential: cert(serviceAccount)
});

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node set-claim.cjs your-test-account@example.com");
    process.exitCode = 1;
    return;
  }

  const auth = getAuth();

  const user = await auth.getUserByEmail(email);

  const existingClaims = user.customClaims || {};

  if (existingClaims.role && existingClaims.role !== "authenticated") {
    throw new Error(
      "This account already has a different role. Review it before proceeding."
    );
  }

  await auth.setCustomUserClaims(user.uid, {
    ...existingClaims,
    role: "authenticated"
  });

  const updatedUser = await auth.getUser(user.uid);

  console.log("Firebase claim updated successfully.");
  console.log("UID:", updatedUser.uid);
  console.log("Role:", updatedUser.customClaims?.role);
  console.log("Other existing claims have been preserved.");
}

main().catch(error => {
  console.error("Failed:", error.message);
  process.exitCode = 1;
});
