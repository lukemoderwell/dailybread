'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Users,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FAMILY_COLORS, getNextAvailableColor } from '@/lib/colors';
import { BIBLE_TRANSLATIONS } from '@/lib/bible-translations';
import { cn } from '@/lib/utils';

interface FamilyMember {
  id: string;
  name: string;
  age: string;
  color: string;
  notes: string;
}

interface OnboardingFormProps {
  userId: string;
}

const STEPS = [
  { id: 1, title: 'Welcome', icon: Sparkles },
  { id: 2, title: 'Your Family', icon: Users },
  { id: 3, title: 'Preferences', icon: Clock },
];

const BOOKS = [
  'Proverbs',
  'Psalms',
  'John',
  'James',
  'Philippians',
  '1 Peter',
  'Genesis',
  'Mark',
  'Ephesians',
  'Colossians',
];

const READING_TIMES = [6, 8, 10, 12, 15];
const REMINDER_HOURS = Array.from({ length: 24 }, (_, i) => i);

const getBookRecommendationReason = (book: string): string => {
  switch (book) {
    case 'Mark':
      return 'It\'s the shortest gospel with action-packed stories that keep young kids engaged.';
    case 'John':
      return 'Beautiful stories about Jesus that are accessible and meaningful for kids.';
    case 'Proverbs':
      return 'Practical wisdom in bite-sized pieces that are easy to discuss with kids.';
    case 'Genesis':
      return 'Classic stories of creation, Noah, and the patriarchs that kids love.';
    case 'James':
      return 'Practical advice for Christian living that older kids can relate to.';
    default:
      return 'A great starting point for family Bible reading.';
  }
};

export default function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 2: Family members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: crypto.randomUUID(),
      name: '',
      age: '',
      color: getNextAvailableColor([]).id,
      notes: '',
    },
  ]);

  // Step 3: Preferences
  const [selectedTranslation, setSelectedTranslation] = useState('de4e12af7f28f599-02'); // KJV default
  const [readingMinutes, setReadingMinutes] = useState(10);
  const [reminderHour, setReminderHour] = useState(18); // 6 PM default
  const [hasAdjustedTime, setHasAdjustedTime] = useState(false);
  const [hasChangedBook, setHasChangedBook] = useState(false);

  const recommendedMinutes = useMemo(() => {
    const ages = familyMembers
      .map((m) => parseInt(m.age))
      .filter((age) => !isNaN(age) && age > 0);

    if (ages.length === 0) return 10;

    const youngest = Math.min(...ages);
    const oldest = Math.max(...ages);

    if (youngest <= 4) return 6;
    if (oldest <= 7) return 8;
    if (oldest <= 9) return 10;
    if (oldest <= 11) return 12;
    return 15;
  }, [familyMembers]);

  const recommendedBook = useMemo(() => {
    const ages = familyMembers
      .map((m) => parseInt(m.age))
      .filter((age) => !isNaN(age) && age > 0);

    if (ages.length === 0) return 'Proverbs';

    const youngest = Math.min(...ages);
    const oldest = Math.max(...ages);

    // Very young kids (4-6): Story-driven books
    if (youngest <= 6) {
      // Prefer Genesis for very young (creation, Noah, etc.) or Mark for action
      return 'Genesis'; // Classic stories kids love
    }
    
    // Young kids (7-9): Gospels with beautiful stories
    if (oldest <= 9) {
      return 'John'; // Beautiful stories, accessible language
    }
    
    // Medium-aged kids (10-12): Wisdom literature
    if (oldest <= 12) {
      return 'Proverbs'; // Practical wisdom, easy to understand
    }
    
    // Older kids (13+): Can handle more complex books
    return 'James'; // Practical Christian living
  }, [familyMembers]);

  const [selectedBook, setSelectedBook] = useState(recommendedBook);

  // Update selected book when recommendation changes (unless user has manually changed it)
  useEffect(() => {
    if (!hasChangedBook) {
      setSelectedBook(recommendedBook);
    }
  }, [recommendedBook, hasChangedBook]);

  useEffect(() => {
    if (!hasAdjustedTime && currentStep === 3) {
      setReadingMinutes(recommendedMinutes);
    }
  }, [recommendedMinutes, hasAdjustedTime, currentStep]);

  const addFamilyMember = () => {
    const usedColors = familyMembers.map((m) => m.color);
    const nextColor = getNextAvailableColor(usedColors);

    setFamilyMembers([
      ...familyMembers,
      {
        id: crypto.randomUUID(),
        name: '',
        age: '',
        color: nextColor.id,
        notes: '',
      },
    ]);
  };

  const removeFamilyMember = (id: string) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter((m) => m.id !== id));
    }
  };

  const updateFamilyMember = (
    id: string,
    field: 'name' | 'age' | 'color' | 'notes',
    value: string
  ) => {
    setFamilyMembers(
      familyMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSelectReadingMinutes = (minutes: number) => {
    setReadingMinutes(minutes);
    setHasAdjustedTime(true);
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1) return true; // Always can proceed from welcome
    if (currentStep === 2) {
      // Need at least one valid family member
      const validMembers = familyMembers.filter(
        (m) => m.name.trim() && m.age && parseInt(m.age) > 0
      );
      return validMembers.length > 0;
    }
    return true; // Step 3 always valid
  };

  const handleNext = () => {
    if (canProceedToNextStep()) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      toast.error('Please complete the required fields');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const supabase = createSupabaseClient();

      // Validate family members
      const validMembers = familyMembers.filter(
        (m) => m.name.trim() && m.age && parseInt(m.age) > 0
      );

      if (validMembers.length === 0) {
        toast.error('Please add at least one family member');
        setLoading(false);
        return;
      }

      // Insert family members
      const { error: membersError } = await supabase
        .from('family_members')
        .insert(
          validMembers.map((m) => ({
            user_id: userId,
            name: m.name.trim(),
            age: parseInt(m.age),
            color: m.color,
            notes: m.notes?.trim() || null,
          }))
        );

      if (membersError) throw membersError;

      // Save preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          bible_translation: selectedTranslation,
          daily_reading_minutes: readingMinutes,
          verses_per_session: Math.round(readingMinutes * 3),
        });

      if (preferencesError) throw preferencesError;

      // Create initial reading progress
      const { error: progressError } = await supabase
        .from('reading_progress')
        .insert({
          user_id: userId,
          current_book: selectedBook,
          current_chapter: 1,
          current_verse: 1,
        });

      if (progressError) throw progressError;

      toast.success("Setup complete! Let's start reading.");
      router.push('/today');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatReminderTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4 gap-x-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all shrink-0',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-background text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <ChevronRight className="h-6 w-6" />
                    ) : (
                      <StepIcon className="h-6 w-6" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium whitespace-nowrap',
                      isActive || isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-16 md:w-24 mx-2 md:mx-4 -mt-6 shrink-0',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="min-h-[400px]">
        <CardContent className="pt-6">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Welcome to dailybread
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Family Bible study made simple & joyful
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-left max-w-lg mx-auto">
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Daily Readings</h3>
                      <p className="text-sm text-muted-foreground">
                        Short Bible passages read aloud, perfect for 5-10 minute
                        family devotions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        Age-Appropriate Questions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Engaging questions tailored to each child&apos;s age and
                        understanding
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Audio-First</h3>
                      <p className="text-sm text-muted-foreground">
                        Everything read aloud so you can focus on your family,
                        not your screen
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Let&apos;s set up your family in just 2 minutes
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Family Setup */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Add Your Family</h2>
                <p className="text-muted-foreground">
                  Tell us about your kids so we can personalize their questions
                </p>
              </div>

              <div className="space-y-4">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-lg border p-4 space-y-3 bg-muted/20"
                  >
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Label
                          htmlFor={`name-${member.id}`}
                          className="sr-only"
                        >
                          Name
                        </Label>
                        <Input
                          id={`name-${member.id}`}
                          placeholder="Name"
                          value={member.name}
                          onChange={(e) =>
                            updateFamilyMember(
                              member.id,
                              'name',
                              e.target.value
                            )
                          }
                          className="h-12"
                        />
                        <Label htmlFor={`age-${member.id}`} className="sr-only">
                          Age
                        </Label>
                        <Input
                          id={`age-${member.id}`}
                          type="number"
                          placeholder="Age"
                          min="1"
                          max="120"
                          value={member.age}
                          onChange={(e) =>
                            updateFamilyMember(member.id, 'age', e.target.value)
                          }
                          className="h-12"
                        />
                      </div>
                      {familyMembers.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 mt-1"
                          onClick={() => removeFamilyMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm">Color</Label>
                        <Select
                          value={member.color}
                          onValueChange={(value) =>
                            updateFamilyMember(member.id, 'color', value)
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Choose a color" />
                          </SelectTrigger>
                          <SelectContent>
                            {FAMILY_COLORS.map((color) => (
                              <SelectItem key={color.id} value={color.id}>
                                <span className="inline-flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: color.value }}
                                  />
                                  {color.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm">Notes (optional)</Label>
                        <Textarea
                          placeholder="Interests, energy level..."
                          value={member.notes}
                          onChange={(e) =>
                            updateFamilyMember(
                              member.id,
                              'notes',
                              e.target.value
                            )
                          }
                          className="min-h-[72px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFamilyMember}
                  className="w-full h-12"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Family Member
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  Set Your Preferences
                </h2>
                <p className="text-muted-foreground">
                  Choose your reading rhythm and starting point
                </p>
              </div>

              {/* Reading Time */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Daily Reading Time
                </Label>
                <p className="text-sm text-muted-foreground">
                  We recommend {recommendedMinutes} minutes based on your
                  kids&apos; ages
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {READING_TIMES.map((minutes) => (
                    <Button
                      key={minutes}
                      type="button"
                      variant={
                        readingMinutes === minutes ? 'default' : 'outline'
                      }
                      className="h-12"
                      onClick={() => handleSelectReadingMinutes(minutes)}
                    >
                      {minutes} min
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bible Translation */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Bible Translation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred Bible translation
                </p>
                <Select
                  value={selectedTranslation}
                  onValueChange={setSelectedTranslation}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BIBLE_TRANSLATIONS.map((trans) => (
                      <SelectItem key={trans.id} value={trans.id}>
                        {trans.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Starting Book */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Choose Your First Book
                  </Label>
                  {selectedBook === recommendedBook && !hasChangedBook && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                {selectedBook === recommendedBook && !hasChangedBook && (
                  <p className="text-sm text-muted-foreground">
                    We recommend <strong>{recommendedBook}</strong> based on your
                    family&apos;s ages. {getBookRecommendationReason(recommendedBook)}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {BOOKS.map((book) => (
                    <button
                      key={book}
                      type="button"
                      onClick={() => {
                        setSelectedBook(book);
                        setHasChangedBook(true);
                      }}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-colors h-12 text-sm relative',
                        selectedBook === book
                          ? 'border-primary bg-primary/10 font-semibold'
                          : 'border-border hover:border-primary/50',
                        book === recommendedBook && !hasChangedBook
                          ? 'ring-2 ring-primary/20'
                          : ''
                      )}
                    >
                      {book}
                      {book === recommendedBook && !hasChangedBook && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminder Time (Coming Soon) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">
                    Daily Reminder
                  </Label>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get notified when it&apos;s time for your daily reading
                </p>
                <Select
                  value={reminderHour.toString()}
                  onValueChange={(value) => setReminderHour(parseInt(value))}
                  disabled
                >
                  <SelectTrigger className="h-12">
                    <SelectValue>
                      {formatReminderTime(reminderHour)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_HOURS.map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {formatReminderTime(hour)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This feature will be available soon
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || loading}
          className="min-w-[100px]"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={loading}
          className="min-w-[100px]"
        >
          {currentStep === 3 ? (
            loading ? (
              'Setting up...'
            ) : (
              'Complete Setup'
            )
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
