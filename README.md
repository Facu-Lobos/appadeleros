# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a file named `.env.local` in the root directory and add your project's environment variables:
   ```
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   SUPABASE_URL="YOUR_SUPABASE_URL"
   SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
   ```
   Replace the placeholder values with your actual credentials. You can get your Supabase keys from your project's dashboard under Settings > API.
3. Run the app:
   `npm run dev`
