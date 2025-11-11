import { NextResponse } from 'next/server';
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const maxDuration = 30;

interface PaintingRequest {
  passage: string;
  reference: string;
  familyMemberAges: number[];
  regenerate?: boolean;
}
interface PassageAnalysis {
  scene: string;
  characters: string;
  setting: string;
  emotion: string;
  suggestedStyle: string;
  visualDetails: string;
  ageAppropriate: boolean;
}

// Classical painting styles suitable for Bible storytelling
const PAINTING_STYLES = {
  rembrandt: {
    name: 'Rembrandt',
    description: 'warm chiaroscuro lighting, intimate and emotional',
    bestFor: ['parables', 'teachings', 'personal stories', 'conversations'],
  },
  caravaggio: {
    name: 'Caravaggio',
    description: 'dramatic lighting, powerful moments',
    bestFor: ['miracles', 'revelations', 'transformations', 'dramatic events'],
  },
  botticelli: {
    name: 'Botticelli',
    description: 'graceful, ethereal, flowing compositions',
    bestFor: ['creation', 'heavenly scenes', 'angels', 'visions'],
  },
  vermeer: {
    name: 'Vermeer',
    description: 'peaceful, domestic, soft natural light',
    bestFor: ['everyday life', 'quiet moments', 'teachings', 'homes'],
  },
  'claude-lorrain': {
    name: 'Claude Lorrain',
    description: 'luminous landscapes, golden light',
    bestFor: ['journeys', 'nature', 'psalms', 'outdoor scenes'],
  },
  raphael: {
    name: 'Raphael',
    description: 'balanced, harmonious, clear compositions',
    bestFor: ['group scenes', 'gatherings', 'teachings', 'communities'],
  },
};

async function analyzePassage(
  passage: string,
  reference: string,
  ages: number[]
): Promise<PassageAnalysis> {
  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);

  const analysisPrompt = `You are an expert art historian and biblical scholar analyzing passages for faithful visual representation in the style of master Renaissance and Baroque painters.

PASSAGE: ${reference}
${passage}

Analyze this passage and provide a JSON response with the following structure:
{
  "scene": "Detailed description of the main visual scene that captures the essence of the passage (2-3 sentences)",
  "characters": "Key people present, their expressions, postures, and emotional states as described in the text",
  "setting": "Physical environment, architectural details, time of day, and historical context",
  "emotion": "Overall emotional tone and spiritual significance (e.g., reverent, triumphant, contemplative, transformative, profound)",
  "suggestedStyle": "One of: rembrandt, caravaggio, botticelli, vermeer, claude-lorrain, or raphael",
  "visualDetails": "Specific visual elements, composition, lighting, and artistic techniques that would authentically represent this passage",
  "ageAppropriate": true/false (is this scene appropriate for children ${minAge}-${maxAge}?)
}

IMPORTANT GUIDELINES:
1. Focus on faithful representation of the biblical text - capture the actual events, emotions, and spiritual significance as written
2. Reference the artistic mastery of works like Rembrandt's "The Return of the Prodigal Son" (intimate emotion, dramatic chiaroscuro, profound human expression) and Da Vinci's "Last Supper" (masterful composition, psychological depth, narrative clarity)
3. Choose painting style based on scene type and emotional content:
   - rembrandt: intimate, emotional scenes with warm chiaroscuro lighting, profound human expression (like The Return of the Prodigal Son)
   - caravaggio: dramatic moments, powerful contrasts, intense emotional impact
   - botticelli: ethereal, heavenly scenes, graceful compositions
   - vermeer: peaceful moments, soft natural light, contemplative atmosphere
   - claude-lorrain: landscapes, journeys, luminous outdoor scenes
   - raphael: balanced group compositions, clear narrative structure (like The School of Athens)
4. Identify the most theologically and visually significant moment in the passage
5. Include specific details about: composition (how figures are arranged), lighting (chiaroscuro, golden hour, dramatic shadows), color palette (rich earth tones, deep blues, warm golds), textures (oil paint brushwork, fabric details, architectural elements), and emotional expression (facial expressions, body language, gestures)
6. Consider the historical and cultural context of the biblical setting

Return ONLY the JSON object, no additional text.`;

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: analysisPrompt,
      temperature: 0,
    });

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in analysis response');
    }

    const analysis: PassageAnalysis = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Passage analysis error:', error);
    // Return a safe default
    return {
      scene: 'A biblical scene',
      characters: 'Biblical figures',
      setting: 'Historical Middle East setting',
      emotion: 'peaceful and reverent',
      suggestedStyle: 'raphael',
      visualDetails: 'Clear, warm lighting with rich earth tones',
      ageAppropriate: true,
    };
  }
}

function constructImagePrompt(
  analysis: PassageAnalysis,
  reference: string
): { prompt: string; style: keyof typeof PAINTING_STYLES } {
  const suggested = analysis.suggestedStyle as keyof typeof PAINTING_STYLES;
  const style = PAINTING_STYLES[suggested] ? suggested : 'raphael';
  const styleInfo = PAINTING_STYLES[style];

  const prompt = `A masterful oil painting in the style of ${styleInfo.name}, depicting a biblical scene from ${reference}. This should be executed with the technical excellence and emotional depth of Renaissance and Baroque masters like Rembrandt and Leonardo da Vinci.

SCENE: ${analysis.scene}

CHARACTERS: ${analysis.characters}

SETTING: ${analysis.setting}

VISUAL STYLE: ${styleInfo.description}. ${analysis.visualDetails}

ATMOSPHERE: ${analysis.emotion}, capturing the spiritual and emotional essence of the passage.

Artistic execution: Masters-level oil painting technique with the sophistication of Rembrandt's "The Return of the Prodigal Son" (dramatic chiaroscuro, profound emotional expression, masterful use of light and shadow) and Da Vinci's "Last Supper" (perfect composition, psychological depth, narrative clarity). 

Technical details:
- Rich, layered oil paint application with visible brushwork
- Masterful chiaroscuro lighting creating depth and drama
- Authentic historical details and period-appropriate clothing
- Expressive faces and gestures that convey the emotional and spiritual weight of the moment
- Sophisticated color palette: deep earth tones, rich blues, warm golds, and subtle flesh tones
- Composition that guides the eye and emphasizes the narrative's key elements
- Textural details: fabric folds, architectural elements, natural textures
- Atmospheric perspective and depth

Faithful representation: Accurately depict the events, characters, and setting as described in the biblical text. Capture the theological significance and emotional resonance of the passage with artistic integrity and reverence.`;

  return { prompt, style };
}

async function createPaintingHash(
  reference: string,
  passage: string,
  style: keyof typeof PAINTING_STYLES,
  ages: number[]
): Promise<string> {
  const encoder = new TextEncoder();
  const normalizedPassage = passage.replace(/\s+/g, ' ').trim();
  const sortedAges = [...ages].sort((a, b) => a - b).join(',');
  const data = encoder.encode(`${reference}|${style}|${normalizedPassage}|${sortedAges}`);
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto API is not available in this environment');
  }
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function checkPaintingExists(publicUrl: string): Promise<boolean> {
  try {
    const response = await fetch(publicUrl, {
      method: 'HEAD',
      cache: 'no-store',
    });
    return response.ok;
  } catch (error) {
    console.warn('Painting existence check failed:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      passage,
      reference,
      familyMemberAges,
      regenerate,
    }: PaintingRequest =
      await req.json();

    console.log('Painting generation request:', {
      reference,
      passageLength: passage.length,
      familyMemberAges,
      regenerate,
    });

    // Step 1: Analyze passage
    const analysis = await analyzePassage(passage, reference, familyMemberAges);

    console.log('Passage analysis:', analysis);

    // Check if content is age-appropriate
    if (!analysis.ageAppropriate) {
      return NextResponse.json(
        {
          error:
            'This passage contains themes that may not be suitable for younger children. Painting generation skipped.',
          skipped: true,
        },
        { status: 200 }
      );
    }

    // Step 2: Construct image prompt
    const { prompt: imagePrompt, style: finalStyle } = constructImagePrompt(
      analysis,
      reference
    );

    const paintingHash = await createPaintingHash(reference, passage, finalStyle, familyMemberAges);
    const filePath = `${user.id}/${paintingHash}.png`;
    const {
      data: { publicUrl },
    } = supabase.storage.from('bible-paintings').getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('Failed to resolve storage URL');
    }

    if (!regenerate) {
      const exists = await checkPaintingExists(publicUrl);
      if (exists) {
        console.log('Reusing existing painting from storage:', publicUrl);

        return NextResponse.json({
          url: publicUrl,
          prompt: imagePrompt,
          style: finalStyle,
          emotion: analysis.emotion,
          reused: true,
        });
      }
    }

    console.log('Image prompt constructed:', imagePrompt.substring(0, 200) + '...');

    // Step 3: Generate image using AI SDK
    const { image } = await generateImage({
      model: openai.image('gpt-image-1-mini'),
      prompt: imagePrompt,
      size: '1536x1024', // 16:9 landscape for visual storytelling
    });

    console.log('Image generated successfully');

    // Step 4: Upload to Supabase Storage
    // Convert base64 to buffer
    const base64Data = image.base64.split(',')[1] || image.base64;
    const binaryString = globalThis.atob(base64Data);
    const binaryLength = binaryString.length;
    const bytes = new Uint8Array(binaryLength);
    for (let i = 0; i < binaryLength; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const { error: uploadError } = await supabase.storage
      .from('bible-paintings')
      .upload(filePath, bytes, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Return image data anyway so user can still see it
      return NextResponse.json({
        base64: image.base64,
        prompt: imagePrompt,
        style: finalStyle,
        storageError: uploadError.message,
      });
    }

    console.log('Painting uploaded to storage:', publicUrl);

    return NextResponse.json({
      url: publicUrl,
      prompt: imagePrompt,
      style: finalStyle,
      emotion: analysis.emotion,
    });
  } catch (error) {
    console.error('Painting generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate painting',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
