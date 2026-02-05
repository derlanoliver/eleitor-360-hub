
Goal
- Restore Z-API sending/receiving by fixing the build so the backend functions can compile and run again.
- Eliminate the repeated “Unsupported compiler options … allowJs” warnings and stop the build from failing on “Import https://esm.sh/@supabase/supabase-js … 500”.

What’s happening (step-by-step diagnosis)
1) The warnings come from `supabase/functions/deno.json`:
   - It currently contains `compilerOptions.allowJs = true`.
   - In the Deno runtime used by the backend-functions toolchain here, `allowJs` is not a supported compiler option, so it is ignored and spammed as warnings.

2) The real build breaker is the import error:
   - Many backend functions import Supabase JS via `https://esm.sh/@supabase/supabase-js@...`.
   - The build log shows esm.sh returning HTTP 500 for that package version.
   - When Deno cannot fetch a remote module at build time, it fails the entire graph compilation, so ALL backend functions stop working (including Z-API webhooks and senders).

3) Because the backend functions fail to build, Z-API “send” and “receive” stop:
   - “Send” (ex: `send-whatsapp`) can’t run.
   - “Receive” (ex: `zapi-webhook`) can’t run.
   - This matches your symptom: “o sistema parou de funcionar… envio e recebimento”.

Solution strategy
- Make the backend functions independent of esm.sh availability by switching Supabase imports to Deno’s native npm specifier (`npm:@supabase/supabase-js@2...`).
- Remove the unsupported `allowJs` option so the build is clean and predictable.
- (Optional but recommended) Standardize imports to a single version so all functions compile against the same API.

Planned code changes (no behavior change intended, only build stability)
A) Fix deno.json warnings
1. Edit `supabase/functions/deno.json`
   - Remove `"allowJs": true`.
   - Keep the rest as-is.

B) Remove dependency on esm.sh for Supabase client
2. Update all backend functions that do:
   - `import { createClient } from "https://esm.sh/@supabase/supabase-js@..."`;
   - Change to:
     - `import { createClient } from "npm:@supabase/supabase-js@2";`
   Notes:
   - Using `@2` (major pin) is typically sufficient and avoids frequent breakage.
   - If this environment requires an exact version pin, we’ll use the app’s installed version (currently `@supabase/supabase-js ^2.58.0` in the frontend) and pin `npm:@supabase/supabase-js@2.58.0` for consistency.

3. Update any other esm.sh imports that are critical and currently failing (example seen: `Resend` imported via esm.sh in `send-email` / `send-event-photos`):
   - If builds still fail after fixing Supabase imports, we’ll migrate those too:
     - `import { Resend } from "npm:resend@2.0.0";`
   - Do this only if they appear in the build error list after step B.

C) Verify Z-API flow end-to-end after build is healthy
4. After the build succeeds again, validate the two critical paths:
   - Outbound: call the backend function that sends WhatsApp (the one your UI uses, likely `send-whatsapp`) with a test phone/template.
   - Inbound: confirm `zapi-webhook` responds 200 to a simulated webhook payload and, if applicable, calls the chatbot.
   - Check backend logs for:
     - Missing `Client-Token` header issues (common Z-API auth failure).
     - Any Z-API HTTP errors now that functions are running again.

Risk & rollback
- These changes are low-risk because they do not alter business logic, only module resolution.
- If anything unexpected happens, rollback is straightforward:
  - Revert imports back to https URLs, but that reintroduces external CDN fragility. The recommended “stable” approach is to keep npm imports.

Acceptance criteria
- Build completes with:
  - No repeated `allowJs` warnings.
  - No esm.sh 500 import errors.
- Z-API sending works again from the UI (messages are created/sent).
- Z-API receiving works again (webhook hits are processed; assistant replies if enabled).
- No “cascade failure” across channels (WhatsApp failure should not block SMS/email flows), preserving your existing resilience requirements.

Files we expect to touch (high confidence)
- `supabase/functions/deno.json`
- Multiple files under `supabase/functions/*/index.ts` that import supabase-js from esm.sh (search shows 30+ functions).

Nice-to-have hardening (after restoring service)
- Add a small internal convention for backend functions:
  - Always use `npm:@supabase/supabase-js@2.x` imports.
  - Avoid remote CDNs for critical dependencies.
- Add a quick “health check” backend function to confirm all key providers (Z-API, Meta Cloud, SMS, Email) are reachable without triggering sends.

