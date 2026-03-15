import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://gtdowhgeswahtqhrwpal.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZG93aGdlc3dhaHRxaHJ3cGFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU2OTg1OCwiZXhwIjoyMDg5MTQ1ODU4fQ.0hG77eso0MVoDt32f3oJ6rp_s0ZBEGMy9Ctxf0lPfKE"
);

export default supabase;