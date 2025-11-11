'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Palette, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BiblePaintingProps {
  reference: string;
  passage: string;
  familyMemberAges: number[];
  sessionId?: string;
  paintingData?: {
    url: string;
    prompt: string;
    style: string;
    emotion?: string;
  } | null;
  onPaintingGenerated?: (data: {
    url: string;
    prompt: string;
    style: string;
  }) => void;
}

export default function BiblePainting({
  reference,
  passage,
  familyMemberAges,
  sessionId,
  paintingData: initialPaintingData,
  onPaintingGenerated,
}: BiblePaintingProps) {
  const [paintingData, setPaintingData] = useState(initialPaintingData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate painting if not provided
  useEffect(() => {
    if (!paintingData && !isGenerating && !error) {
      generatePainting();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generatePainting = async (regenerate = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/bible/generate-painting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage,
          reference,
          familyMemberAges,
          regenerate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate painting');
      }

      // Check if painting was skipped due to age-appropriateness
      if (data.skipped) {
        setError(data.error);
        return;
      }

      setPaintingData({
        url: data.url || `data:image/png;base64,${data.base64}`,
        prompt: data.prompt,
        style: data.style,
        emotion: data.emotion,
      });

      if (onPaintingGenerated) {
        onPaintingGenerated({
          url: data.url,
          prompt: data.prompt,
          style: data.style,
        });
      }

      if (regenerate) {
        toast.success(
          data.reused ? 'Reused existing painting.' : 'New painting generated!'
        );
      }
    } catch (err) {
      console.error('Painting generation error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to generate painting'
      );
      toast.error('Failed to generate painting');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!paintingData?.url) return;

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = paintingData.url;
    link.download = `${reference.replace(/\s+/g, '_')}_painting.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Painting downloaded!');
  };

  const handleRegenerate = () => {
    generatePainting(true);
  };

  if (error) {
    return (
      <Card className="border-0 md:border shadow-none md:shadow-sm mb-6 mt-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card className="border-0 md:border shadow-none md:shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="relative w-full aspect-[16/9] bg-muted rounded-lg overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 animate-pulse" />

            {/* Loading content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
              <div className="flex items-center gap-3">
                <Palette className="h-6 w-6 animate-spin text-primary" />
                <p className="text-lg font-medium">Painting...</p>
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Creating a classical-style illustration of {reference}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paintingData) {
    return null;
  }

  return (
    <Card className="border-0 md:border shadow-none md:shadow-sm mb-6">
      <CardContent className="p-0 md:p-6">
        <div className="space-y-4">
          {/* Image */}
          <div className="relative w-full aspect-[16/9] bg-muted rounded-lg overflow-hidden">
            <Image
              src={paintingData.url}
              alt={`Biblical painting of ${reference}`}
              fill
              className="object-cover"
              unoptimized={paintingData.url.startsWith('data:')}
            />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-0">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {paintingData.style.charAt(0).toUpperCase() +
                  paintingData.style.slice(1)}{' '}
                style
                {paintingData.emotion && ` • ${paintingData.emotion}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>

              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
