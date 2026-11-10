import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iihyjghdnqrnlrtlsxef.supabase.co'
const supabasePublishableKey = 'sb_publishable_9afzFvoCnEmEFTHNB_mgCQ_B262IDk3'

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
