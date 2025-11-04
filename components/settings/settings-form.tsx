"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, BookOpen, RotateCcw, User, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
} from "@/components/ui/alert-dialog";

interface FamilyMember {
  id: string;
  name: string;
  age: number;
}

interface UserPreferences {
  bible_translation: string;
  tts_voice: string;
  daily_reading_minutes: number;
  enable_tts: boolean;
  verses_per_session: number;
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

const BIBLE_TRANSLATIONS = [
  { id: "de4e12af7f28f599-02", name: "King James Version (KJV)" },
  { id: "06125adad2d5898a-01", name: "New International Version (NIV)" },
  { id: "9879dbb7cfe39e4d-04", name: "New Revised Standard Version (NRSV)" },
  { id: "592420522e16049f-01", name: "English Standard Version (ESV)" },
  { id: "f72b840c855f362c-04", name: "New Living Translation (NLT)" },
];

const TTS_VOICES = [
  { id: "alloy", name: "Alloy (Neutral)" },
  { id: "echo", name: "Echo (Warm)" },
  { id: "fable", name: "Fable (Expressive)" },
  { id: "onyx", name: "Onyx (Deep)" },
  { id: "nova", name: "Nova (Clear)" },
  { id: "shimmer", name: "Shimmer (Bright)" },
];

const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah",
  "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai",
  "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John",
  "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians",
  "Ephesians", "Philippians", "Colossians", "1 Thessalonians",
  "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
  "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation"
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
  const [userName, setUserName] = useState(initialUserName || "");

  // Preferences state
  const [translation, setTranslation] = useState(
    initialPreferences?.bible_translation || "de4e12af7f28f599-02"
  );
  const [voice, setVoice] = useState(
    initialPreferences?.tts_voice || "onyx"
  );
  const [readingMinutes, setReadingMinutes] = useState(
    initialPreferences?.daily_reading_minutes || 10
  );
  const [enableTts, setEnableTts] = useState(
    initialPreferences?.enable_tts ?? true
  );

  // Calculate verses per session based on reading minutes
  // Average reading speed: ~3 verses per minute
  const versesPerSession = Math.round(readingMinutes * 3);

  // Family members state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(initialFamilyMembers);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAge, setNewMemberAge] = useState("");

  // Reading plan state
  const [currentBook, setCurrentBook] = useState(initialReadingProgress?.current_book || "Genesis");
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleAddFamilyMember = async () => {
    if (!newMemberName || !newMemberAge) {
      toast.error("Please enter both name and age");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("family_members")
        .insert({
          user_id: userId,
          name: newMemberName,
          age: parseInt(newMemberAge),
        })
        .select()
        .single();

      if (error) throw error;

      setFamilyMembers([...familyMembers, data]);
      setNewMemberName("");
      setNewMemberAge("");
      toast.success(`Added ${newMemberName}`);
    } catch (error) {
      console.error("Error adding family member:", error);
      toast.error("Failed to add family member");
    }
  };

  const handleRemoveFamilyMember = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFamilyMembers(familyMembers.filter((m) => m.id !== id));
      toast.success(`Removed ${name}`);
    } catch (error) {
      console.error("Error removing family member:", error);
      toast.error("Failed to remove family member");
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);

    try {
      // Use API route to save preferences server-side
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bible_translation: translation,
          tts_voice: voice,
          daily_reading_minutes: readingMinutes,
          enable_tts: enableTts,
          verses_per_session: versesPerSession,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save preferences");
      }

      toast.success("Settings saved!");
      router.refresh();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeBook = async () => {
    if (currentBook === initialReadingProgress?.current_book) {
      toast.error("Please select a different book");
      return;
    }

    setIsUpdatingPlan(true);

    try {
      const response = await fetch("/api/reading-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_book",
          new_book: currentBook,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change book");
      }

      toast.success(`Switched to ${currentBook}!`);
      router.refresh();
    } catch (error) {
      console.error("Error changing book:", error);
      toast.error(error instanceof Error ? error.message : "Failed to change book");
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleRestartBook = async () => {
    setIsUpdatingPlan(true);

    try {
      const response = await fetch("/api/reading-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restart_book",
          book: initialReadingProgress?.current_book,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to restart book");
      }

      toast.success(`Restarted ${initialReadingProgress?.current_book}!`);
      router.refresh();
    } catch (error) {
      console.error("Error restarting book:", error);
      toast.error(error instanceof Error ? error.message : "Failed to restart book");
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      toast.error("Please enter both password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update password");
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

      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <Tabs defaultValue="reading" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="reading">Reading</TabsTrigger>
        <TabsTrigger value="family">Family Members</TabsTrigger>
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
                <span className="text-sm text-muted-foreground">Current Book:</span>
                <span className="font-semibold">{initialReadingProgress.current_book}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Chapter:</span>
                <span className="font-semibold">{initialReadingProgress.current_chapter}</span>
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
                  disabled={isUpdatingPlan || currentBook === initialReadingProgress.current_book}
                  className="w-full"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {isUpdatingPlan ? "Switching..." : "Switch to This Book"}
                </Button>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label>Restart current book</Label>
                <p className="text-sm text-muted-foreground">
                  This will reset your progress to chapter 1 of {initialReadingProgress.current_book}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isUpdatingPlan} className="w-full">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restart {initialReadingProgress.current_book}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restart {initialReadingProgress.current_book}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset your progress to chapter 1. Your reading streak will be preserved,
                        but you&apos;ll start this book from the beginning.
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

      {/* Text-to-Speech */}
      <Card>
        <CardHeader>
          <CardTitle>Text-to-Speech (TTS)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enable-tts">Enable TTS Audio</Label>
              <p className="text-sm text-muted-foreground">
                Generate audio for Bible passages (disabling saves API costs)
              </p>
            </div>
            <Switch
              id="enable-tts"
              checked={enableTts}
              onCheckedChange={setEnableTts}
            />
          </div>

          {enableTts && (
            <div className="pt-4 border-t space-y-2">
              <Label>Voice Style</Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TTS_VOICES.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

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
            min={5}
            max={30}
            step={5}
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
        {isSaving ? "Saving..." : "Save Reading Settings"}
      </Button>
      </TabsContent>

      {/* Family Members Tab */}
      <TabsContent value="family" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Family Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-muted-foreground">Age {member.age}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFamilyMember(member.id, member.name)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
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
                if (e.key === "Enter") {
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
            {isUpdatingPassword ? "Updating..." : "Update Profile"}
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
            Set or update your password. This allows you to sign in without waiting for a magic link.
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
            disabled={isUpdatingPassword || !newPassword || !confirmNewPassword}
            className="w-full"
          >
            {isUpdatingPassword ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
      </TabsContent>
    </Tabs>
  );
}
