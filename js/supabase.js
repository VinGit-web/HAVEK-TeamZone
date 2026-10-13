
import { auth } from "./firebase.js";

import {
  createClient
} from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "YOUR_SUPABASE_PROJECT_URL";

const supabasePublishableKey =
  "YOUR_SUPABASE_PUBLISHABLE_KEY";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    accessToken: async () => {
      const user = auth.currentUser;

      if (!user) return null;

      return await user.getIdToken();
    }
  }
);
