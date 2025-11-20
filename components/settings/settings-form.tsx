'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Trash2,
  Save,
  BookOpen,
  RotateCcw,
  User,
  Moon,
  Sun,
  // Palette,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  FAMILY_COLORS,
  getNextAvailableColor,
  getColorById,
} from '@/lib/colors';
import { BIBLE_TRANSLATIONS } from '@/lib/bible-translations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  color: string;
  notes?: string | null;
}

interface UserPreferences {
  bible_translation: string;
  daily_reading_minutes: number;
  verses_per_session: number;
  enable_paintings?: boolean;
  painting_style_preference?: string;
}

interface ReadingProgress {
  current_book: string;
  current_chapter: number;
  current_streak: number;
  longest_streak: number;
}

interface SettingsFormProps {
  userId: string;
  userEmail: string;
  userName: string | null;
  initialPreferences: UserPreferences | null;
  initialFamilyMembers: FamilyMember[];
  initialReadingProgress: ReadingProgress | null;
}

const BIBLE_BOOKS = [
  'Genesis',
  'Exodus',
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  'Joshua',
  'Judges',
  'Ruth',
  '1 Samuel',
  '2 Samuel',
  '1 Kings',
  '2 Kings',
  '1 Chronicles',
  '2 Chronicles',
  'Ezra',
  'Nehemiah',
  'Esther',
  'Job',
  'Psalms',
  'Proverbs',
  'Ecclesiastes',
  'Song of Solomon',
  'Isaiah',
  'Jeremiah',
  'Lamentations',
  'Ezekiel',
  'Daniel',
  'Hosea',
  'Joel',
  'Amos',
  'Obadiah',
  'Jonah',
  'Micah',
  'Nahum',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
  'Malachi',
  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Romans',
  '1 Corinthians',
  '2 Corinthians',
  'Galatians',
  'Ephesians',
  'Philippians',
  'Colossians',
  '1 Thessalonians',
  '2 Thessalonians',
  '1 Timothy',
  '2 Timothy',
  'Titus',
  'Philemon',
  'Hebrews',
  'James',
  '1 Peter',
  '2 Peter',
  '1 John',
  '2 John',
  '3 John',
  'Jude',
  'Revelation',
];

export default function SettingsForm({
  userId,
  userEmail,
  userName: initialUserName,
  initialPreferences,
  initialFamilyMembers,
  initialReadingProgress,
}: SettingsFormProps) {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const { theme, setTheme } = useTheme();

  // Profile state
  const [userName, setUserName] = useState(initialUserName || '');

  // Preferences state
  const [translation, setTranslation] = useState(
    initialPreferences?.bible_translation || 'de4e12af7f28f599-02'
  );
  const [readingMinutes, setReadingMinutes] = useState(
    initialPreferences?.daily_reading_minutes || 10
  );
  // const [enablePaintings, setEnablePaintings] = useState(
  //   initialPreferences?.enable_paintings ?? false
  // );

  // Calculate verses per session based on reading minutes
  // Average reading speed: ~3 verses per minute
  const versesPerSession = Math.round(readingMinutes * 3);

  // Family members state
  const [familyMembers, setFamilyMembers] =
    useState<FamilyMember[]>(initialFamilyMembers);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('');

  // Reading plan state
  const [currentBook, setCurrentBook] = useState(
    initialReadingProgress?.current_book || 'Genesis'
  );
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleAddFamilyMember = async () => {
    if (!newMemberName || !newMemberAge) {
      toast.error('Please enter both name and age');
      return;
    }

    try {
      // Get next available color
      const usedColors = familyMembers.map((m) => m.color);
      const assignedColor = getNextAvailableColor(usedColors);

      const { data, error } = await supabase
        .from('family_members')
        .insert({
          user_id: userId,
          name: newMemberName,
          age: parseInt(newMemberAge),
          color: assignedColor.id,
        })
        .select()
        .single();

      if (error) throw error;

      setFamilyMembers([...familyMembers, data]);
      setNewMemberName('');
      setNewMemberAge('');
      toast.success(`Added ${newMemberName}`);
    } catch (error) {
      console.error('Error adding family member:', error);
      toast.error('Failed to add family member');
    }
  };

  const handleRemoveFamilyMember = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFamilyMembers(familyMembers.filter((m) => m.id !== id));
      toast.success(`Removed ${name}`);
    } catch (error) {
      console.error('Error removing family member:', error);
      toast.error('Failed to remove family member');
    }
  };

  const handleUpdateMemberColor = async (id: string, colorId: string) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ color: colorId })
        .eq('id', id);

      if (error) throw error;

      setFamilyMembers(
        familyMembers.map((m) => (m.id === id ? { ...m, color: colorId } : m))
      );

      const colorName = getColorById(colorId).name;
      toast.success(`Color updated to ${colorName}`);
    } catch (error) {
      console.error('Error updating color:', error);
      toast.error('Failed to update color');
    }
  };

  const handleUpdateMemberNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ notes: notes || null })
        .eq('id', id);

      if (error) throw error;

      setFamilyMembers(
        familyMembers.map((m) => (m.id === id ? { ...m, notes } : m))
      );

      toast.success('Notes saved');
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);

    try {
      // Use API route to save preferences server-side
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bible_translation: translation,
          daily_reading_minutes: readingMinutes,
          verses_per_session: versesPerSession,
          // enable_paintings: enablePaintings,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save preferences');
      }

      toast.success('Settings saved!');
      router.refresh();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeBook = async () => {
    if (currentBook === initialReadingProgress?.current_book) {
      toast.error('Please select a different book');
      return;
    }

    setIsUpdatingPlan(true);

    try {
      const response = await fetch('/api/reading-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_book',
          new_book: currentBook,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change book');
      }

      toast.success(`Switched to ${currentBook}!`);
      router.refresh();
    } catch (error) {
      console.error('Error changing book:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to change book'
      );
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleRestartBook = async () => {
    setIsUpdatingPlan(true);

    try {
      const response = await fetch('/api/reading-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restart_book',
          book: initialReadingProgress?.current_book,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to restart book');
      }

      toast.success(`Restarted ${initialReadingProgress?.current_book}!`);
      router.refresh();
    } catch (error) {
      console.error('Error restarting book:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to restart book'
      );
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      toast.error('Please enter both password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update password'
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: userName,
        },
      });

      if (error) throw error;

      toast.success('Profile updated successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <Tabs defaultValue="reading" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="reading">Reading</TabsTrigger>
        <TabsTrigger value="family">Family</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>

      {/* Reading Tab */}
      <TabsContent value="reading" className="space-y-6">
        {/* Reading Plan */}
        {initialReadingProgress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Reading Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Current Book:
                  </span>
                  <span className="font-semibold">
                    {initialReadingProgress.current_book}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Current Chapter:
                  </span>
                  <span className="font-semibold">
                    {initialReadingProgress.current_chapter}
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Switch to a different book</Label>
                  <Select value={currentBook} onValueChange={setCurrentBook}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] overflow-y-auto">
                      {BIBLE_BOOKS.map((book) => (
                        <SelectItem key={book} value={book}>
                          {book}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleChangeBook}
                    disabled={
                      isUpdatingPlan ||
                      currentBook === initialReadingProgress.current_book
                    }
                    className="w-full"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {isUpdatingPlan ? 'Switching...' : 'Switch to This Book'}
                  </Button>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label>Restart current book</Label>
                  <p className="text-sm text-muted-foreground">
                    This will reset your progress to chapter 1 of{' '}
                    {initialReadingProgress.current_book}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={isUpdatingPlan}
                        className="w-full"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restart {initialReadingProgress.current_book}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Restart {initialReadingProgress.current_book}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset your progress to chapter 1. Your
                          reading streak will be preserved, but you&apos;ll
                          start this book from the beginning.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestartBook}>
                          Restart Book
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bible Translation */}
        <Card>
          <CardHeader>
            <CardTitle>Bible Translation</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={translation} onValueChange={setTranslation}>
              <SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Bible Paintings - Commented out for now */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Bible Paintings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable-paintings">Enable AI Paintings</Label>
                <p className="text-sm text-muted-foreground">
                  Generate beautiful classical-style illustrations for each
                  reading
                </p>
              </div>
              <Switch
                id="enable-paintings"
                checked={enablePaintings}
                onCheckedChange={setEnablePaintings}
              />
            </div>

            {enablePaintings && (
              <p className="text-sm text-muted-foreground pt-4 border-t">
                Paintings are generated automatically in a classical style that
                best fits each passage.
              </p>
            )}
          </CardContent>
        </Card> */}

        {/* Reading Length */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Reading Length</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Reading time</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  ~{versesPerSession} verses per session
                </p>
              </div>
              <span className="text-2xl font-bold">{readingMinutes} min</span>
            </div>
            <Slider
              value={[readingMinutes]}
              onValueChange={(value) => setReadingMinutes(value[0])}
              min={3}
              max={30}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Based on average reading speed of 3 verses per minute
            </p>
          </CardContent>
        </Card>

        {/* Save Reading Settings Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleSavePreferences}
          disabled={isSaving}
        >
          <Save className="h-5 w-5 mr-2" />
          {isSaving ? 'Saving...' : 'Save Reading Settings'}
        </Button>
      </TabsContent>

      {/* Family Members Tab */}
      <TabsContent value="family" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Family</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {familyMembers.map((member) => {
              const memberColor = getColorById(member.color);
              return (
                <div
                  key={member.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  {/* Header: Avatar, Name, Color, Delete */}
                  <div className="flex items-center gap-3">
                    {/* Color indicator */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                      style={{
                        backgroundColor: memberColor.value,
                        color: memberColor.textColor,
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name and age */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Age {member.age}
                      </p>
                    </div>

                    {/* Color picker - simple circle selector */}
                    <Select
                      value={member.color}
                      onValueChange={(colorId) =>
                        handleUpdateMemberColor(member.id, colorId)
                      }
                    >
                      <SelectTrigger className="w-10 h-10 p-0 border-0 rounded-full flex-shrink-0 [&>svg]:hidden">
                        <div
                          className="w-10 h-10 rounded-full border-2 border-border/50"
                          style={{ backgroundColor: memberColor.value }}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {FAMILY_COLORS.map((color) => (
                          <SelectItem key={color.id} value={color.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full border-2"
                                style={{ backgroundColor: color.value }}
                              />
                              <span>{color.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      onClick={() =>
                        handleRemoveFamilyMember(member.id, member.name)
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Notes field - full width below */}
                  <div className="space-y-2">
                    <Label
                      htmlFor={`notes-${member.id}`}
                      className="text-sm font-medium"
                    >
                      Notes (optional)
                    </Label>
                    <Textarea
                      id={`notes-${member.id}`}
                      placeholder="Interests, personality, what they're working on..."
                      value={member.notes || ''}
                      onChange={(e) => {
                        // Update local state immediately for responsiveness
                        setFamilyMembers(
                          familyMembers.map((m) =>
                            m.id === member.id
                              ? { ...m, notes: e.target.value }
                              : m
                          )
                        );
                      }}
                      onBlur={(e) => {
                        // Save to database on blur
                        handleUpdateMemberNotes(member.id, e.target.value);
                      }}
                      className="min-h-[80px] resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      Helps create personalized discussion questions
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-2 pt-4 border-t">
              <Input
                placeholder="Name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFamilyMember();
                  }
                }}
              />
              <Input
                type="number"
                placeholder="Age"
                value={newMemberAge}
                onChange={(e) => setNewMemberAge(e.target.value)}
                className="w-24"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFamilyMember();
                  }
                }}
              />
              <Button onClick={handleAddFamilyMember}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Profile Tab */}
      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userEmail}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <Button
              onClick={handleUpdateProfile}
              disabled={isUpdatingPassword}
              className="w-full"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how dailybread looks to you
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Password Update */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set or update your password. This allows you to sign in without
              waiting for a magic link.
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isUpdatingPassword}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isUpdatingPassword}
                minLength={6}
              />
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={
                isUpdatingPassword || !newPassword || !confirmNewPassword
              }
              className="w-full"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Sign out of your account
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
