"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FamilyMember {
  id: string;
  name: string;
  age: string;
}

interface OnboardingFormProps {
  userId: string;
}

export default function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: crypto.randomUUID(), name: "", age: "" },
  ]);
  const [selectedBook, setSelectedBook] = useState("Proverbs");

  const addFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      { id: crypto.randomUUID(), name: "", age: "" },
    ]);
  };

  const removeFamilyMember = (id: string) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter((m) => m.id !== id));
    }
  };

  const updateFamilyMember = (
    id: string,
    field: "name" | "age",
    value: string
  ) => {
    setFamilyMembers(
      familyMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createSupabaseClient();

      // Validate
      const validMembers = familyMembers.filter(
        (m) => m.name.trim() && m.age && parseInt(m.age) > 0
      );

      if (validMembers.length === 0) {
        toast.error("Please add at least one family member");
        setLoading(false);
        return;
      }

      // Insert family members
      const { error: membersError } = await supabase
        .from("family_members")
        .insert(
          validMembers.map((m) => ({
            user_id: userId,
            name: m.name.trim(),
            age: parseInt(m.age),
          }))
        );

      if (membersError) throw membersError;

      // Create initial reading progress
      const { error: progressError } = await supabase
        .from("reading_progress")
        .insert({
          user_id: userId,
          current_book: selectedBook,
          current_chapter: 1,
        });

      if (progressError) throw progressError;

      toast.success("Setup complete! Let's start reading.");
      router.push("/today");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const books = [
    "Proverbs",
    "Psalms",
    "John",
    "James",
    "Philippians",
    "1 Peter",
    "Genesis",
    "Mark",
    "Ephesians",
    "Colossians",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Your Family Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {familyMembers.map((member, index) => (
            <div key={member.id} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor={`name-${member.id}`} className="sr-only">
                  Name
                </Label>
                <Input
                  id={`name-${member.id}`}
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) =>
                    updateFamilyMember(member.id, "name", e.target.value)
                  }
                  className="h-12"
                />
              </div>
              <div className="w-24">
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
                    updateFamilyMember(member.id, "age", e.target.value)
                  }
                  className="h-12"
                />
              </div>
              {familyMembers.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => removeFamilyMember(member.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Choose Your First Book</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {books.map((book) => (
              <button
                key={book}
                type="button"
                onClick={() => setSelectedBook(book)}
                className={`p-3 rounded-lg border-2 transition-colors h-12 ${
                  selectedBook === book
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {book}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full h-12">
        {loading ? "Setting up..." : "Start Reading"}
      </Button>
    </form>
  );
}
