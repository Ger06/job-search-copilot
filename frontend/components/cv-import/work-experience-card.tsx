"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DraftWorkExperience } from "@/lib/cv-parse-result";

export function WorkExperienceCard({
  index,
  workExperience,
  onChange,
}: {
  index: number;
  workExperience: DraftWorkExperience;
  onChange: (next: DraftWorkExperience) => void;
}) {
  const companyFieldId = `company-${index}`;
  function updateBulletText(index: number, text: string) {
    const bullets = workExperience.bullets.map((bullet, i) => (i === index ? { text } : bullet));
    onChange({ ...workExperience, bullets });
  }

  function removeBullet(index: number) {
    onChange({ ...workExperience, bullets: workExperience.bullets.filter((_, i) => i !== index) });
  }

  function addBullet() {
    onChange({ ...workExperience, bullets: [...workExperience.bullets, { text: "" }] });
  }

  return (
    <Card className="shrink-0">
      <CardHeader className="gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={companyFieldId}>Empresa</Label>
            <Input
              id={companyFieldId}
              value={workExperience.company}
              onChange={(event) => onChange({ ...workExperience, company: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Puesto</Label>
            <Input value={workExperience.role} onChange={(event) => onChange({ ...workExperience, role: event.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Desde</Label>
            <Input
              type="date"
              value={workExperience.startDate}
              onChange={(event) => onChange({ ...workExperience, startDate: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Hasta</Label>
            <Input
              type="date"
              value={workExperience.endDate ?? ""}
              onChange={(event) => onChange({ ...workExperience, endDate: event.target.value || null })}
              placeholder="Actual"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Label className="text-muted-foreground">Logros</Label>
        {workExperience.bullets.map((bullet, index) => (
          <div key={index} className="flex items-start gap-2">
            <Textarea
              value={bullet.text}
              onChange={(event) => updateBulletText(index, event.target.value)}
              className="min-h-16 flex-1"
            />
            <Button variant="ghost" size="icon" aria-label="Quitar logro" onClick={() => removeBullet(index)}>
              ×
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addBullet} className="self-start">
          + Agregar logro
        </Button>
      </CardContent>
    </Card>
  );
}
