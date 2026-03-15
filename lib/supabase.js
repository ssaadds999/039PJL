import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://gtdowhgeswahtqhrwpal.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0ZG93aGdlc3dhaHRxaHJ3cGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Njk4NTgsImV4cCI6MjA4OTE0NTg1OH0.qPQt0mObobWLD6XHkVRVE0By-T7b1wjvQJMPIbMqJoM"
);

export default supabase;