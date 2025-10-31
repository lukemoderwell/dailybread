"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface FamilyMember {
  id: string;
  name: string;
  age: number;
}

interface UserPreferences {
  bible_translation: string;
  tts_voice: string;
  daily_reading_minutes: number;
}

interface SettingsFormProps {
  userId: string;
  initialPreferences: UserPreferences | null;
  initialFamilyMembers: FamilyMember[];
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

export default function SettingsForm({
  userId,
  initialPreferences,
  initialFamilyMembers,
}: SettingsFormProps) {
  const router = useRouter();
  const supabase = createSupabaseClient();

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

  // Family members state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(initialFamilyMembers);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAge, setNewMemberAge] = useState("");

  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Family Members */}
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

      {/* Voice Style */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Style</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Reading Length */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Reading Length</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Estimated listening time</Label>
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
            Adjust how much content you want to read each day
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleSavePreferences}
        disabled={isSaving}
      >
        <Save className="h-5 w-5 mr-2" />
        {isSaving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
