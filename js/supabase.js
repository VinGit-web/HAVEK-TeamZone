
import { auth } from "./firebase.js";

import {
  createClient
} from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ujftkcqylocqwfrbmwrh.supabase.co";

const supabasePublishableKey =
  "sb_publishable_xnxILfnj_uTJh8Eq66stwA_D2JPtoLm";

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
