// supabase/functions/insert_bottle.js
// Example Supabase Edge Function (Node / Deno-compatible) to validate and insert a bottle
// - Use SUPABASE_URL and SUPABASE_SERVICE_KEY (service role) as environment variables on the server
// - This function performs server-side validation and risk checks before inserting into DB

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

// Basic server-side validators
function sanitizeInput(text) {
  if (!text) return ''
  // collapse spaces and trim
  return text.replace(/\s{2,}/g, ' ').trim().slice(0, 2000)
}

function containsDangerousMarkup(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return lower.includes('<script') || lower.includes('</script>') || /javascript:\s*/.test(lower)
}

export default async (req, ctx) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
    const body = await req.json()
    const { content, mood, moodColor, isAnonymous } = body

    // Server-side validation
    const clean = sanitizeInput(content)
    if (!clean || clean.length < 3) return new Response(JSON.stringify({ error: '内容太短' }), { status: 400 })
    if (containsDangerousMarkup(clean)) return new Response(JSON.stringify({ error: '内容包含不允许的标签' }), { status: 400 })

    // Rate limiting (basic, in-memory per function instance). For production, use Redis or durable store.
    // NOTE: Edge function instances can be ephemeral; use a shared store for robust rate-limiting.
    // Example: limit 6 bottles per hour per user (identified by JWT subject)

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    let userId = null
    if (token) {
      // Verify token with Supabase auth
      const { data: userData, error: userErr } = await supabase.auth.getUser(token)
      if (userErr) {
        // invalid token -> still allow anonymous if desired, but do not allow server-side write as a user
        userId = null
      } else {
        userId = userData?.user?.id
      }
    }

    // Insert using service key (bypass RLS) but set user_id if available
    const insertRow = {
      content: clean,
      mood: mood || null,
      mood_color: moodColor || null,
      is_anonymous: !!isAnonymous,
      user_id: userId,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase.from('bottles').insert(insertRow).select().single()
    if (error) {
      console.error('Insert error', error)
      return new Response(JSON.stringify({ error: '插入失败' }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true, bottle: data }), { status: 201 })
  } catch (err) {
    console.error('Function error', err)
    return new Response(JSON.stringify({ error: '服务器错误' }), { status: 500 })
  }
}
