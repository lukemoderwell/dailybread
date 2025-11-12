# Bible Painting Feature Setup Guide

This guide explains how to set up the AI-powered Bible painting generation feature.

## Prerequisites

- OpenAI API key configured (`OPENAI_API_KEY` in `.env.local`)
- Supabase project configured
- Database migrations applied

## 1. Run Database Migration

Apply the painting preferences migration:

```bash
# This adds enable_paintings and painting_style_preference columns
# to the user_preferences table
```

The migration file `011_add_painting_preferences.sql` should be applied to your Supabase database.

## 2. Create Supabase Storage Bucket

You need to create a storage bucket for the paintings:

### Via Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Configure the bucket:
   - **Name**: `bible-paintings`
   - **Public**: ✅ Yes (so users can view their paintings)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/png`, `image/jpeg`, `image/webp`

### Set up RLS Policies:

In the **Policies** tab for the `bible-paintings` bucket, add these policies:

#### 1. Insert Policy - "Users can upload own paintings"
```sql
CREATE POLICY "Users can upload own paintings"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bible-paintings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 2. Select Policy - "Users can read own paintings"
```sql
CREATE POLICY "Users can read own paintings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bible-paintings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 3. Update Policy - "Users can update own paintings"
```sql
CREATE POLICY "Users can update own paintings"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bible-paintings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 4. Delete Policy - "Users can delete own paintings"
```sql
CREATE POLICY "Users can delete own paintings"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bible-paintings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Via Supabase CLI (Alternative):

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Create the bucket
supabase storage create bible-paintings --public

# Apply RLS policies (run the SQL above in your SQL editor)
```

## 3. Environment Variables

Ensure your `.env.local` has:

```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 4. How It Works

### User Flow:

1. User navigates to **Today's Reading** page
2. If **Enable Paintings** is ON in settings:
   - Component automatically generates a painting for the passage
   - Loading state shows while generating (~5-15 seconds)
   - Painting displays above Scripture/Questions tabs
3. Users can:
   - Change painting style and regenerate
   - Download paintings
   - Disable paintings in settings to save API costs

### Technical Flow:

```
ReadingExperience Component
  ↓
  (if enablePaintings)
  ↓
BiblePainting Component
  ↓
  useEffect triggers generation
  ↓
API: /api/bible/generate-painting
  ↓
  1. GPT-4o-mini analyzes passage
  2. Constructs image prompt with classical style
  3. gpt-image-1-mini generates image
  4. Uploads to Supabase Storage
  ↓
Returns URL to component
  ↓
Displays painting with controls
```

### API Endpoints:

- **`POST /api/bible/generate-painting`**: Generate a painting
  - Input: `{ passage, reference, familyMemberAges, stylePreference? }`
  - Output: `{ url, prompt, style, emotion }`
  - Edge runtime compatible
  - 30 second timeout

### Settings:

Users can configure:
- **Enable Paintings**: ON/OFF toggle
- **Painting Style**: Auto, Rembrandt, Caravaggio, Botticelli, Vermeer, Claude Lorrain, Raphael

## 5. Cost Estimates

- **gpt-image-1-mini**: ~$0.02-0.04 per image
- **GPT-4o-mini** (analysis): ~$0.001 per passage
- **Total per reading**: ~$0.03-0.05
- **With caching**: Cost amortized across users reading same passages

## 6. Caching Strategy

Paintings are:
- Uploaded to Supabase Storage with permanent URLs
- Can be linked in `reading_sessions.content` for historical access
- Reusable if same passage/style is requested again

## 7. Troubleshooting

### Storage Upload Fails

- Check that `bible-paintings` bucket exists
- Verify RLS policies are set correctly
- Ensure service role key is configured
- Check storage limits haven't been exceeded

### Image Generation Fails

- Verify `OPENAI_API_KEY` is valid
- Check OpenAI API usage limits
- Review error logs in API route
- Ensure passage text isn't too long (should be trimmed)

### Paintings Don't Show

- Check `enable_paintings` is `true` in user preferences
- Verify component receives `enablePaintings` prop
- Check browser console for errors
- Ensure not viewing historical session (paintings only on "today")

## 8. Classical Painting Styles

The AI chooses or users can select from:

- **Auto**: AI selects best style for passage
- **Rembrandt**: Warm, intimate lighting - best for parables, personal stories
- **Caravaggio**: Dramatic lighting - best for miracles, revelations
- **Botticelli**: Ethereal, graceful - best for creation, heavenly scenes
- **Vermeer**: Peaceful, domestic - best for teachings, quiet moments
- **Claude Lorrain**: Luminous landscapes - best for journeys, nature psalms
- **Raphael**: Balanced, harmonious - best for group scenes, teachings

## 9. Future Enhancements

Potential improvements:
- Cache paintings in reading_sessions.content
- Gallery view of past paintings
- Share paintings socially
- Print-ready high-resolution exports
- Custom style training (fine-tuning)
- Batch generation for reading plans

## Support

For issues, check:
1. Browser console logs
2. Server logs (Vercel/Railway)
3. Supabase logs (Storage + Database)
4. OpenAI API dashboard for usage/errors
