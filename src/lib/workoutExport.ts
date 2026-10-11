import { jsPDF } from "jspdf";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
}

interface WorkoutDay {
  day: string;
  exercises: Exercise[];
}

interface ExportPlan {
  title: string;
  days: WorkoutDay[];
  level?: string;
  goal?: string;
  userName?: string; //  username of the user
}

export async function exportPlanAsPdf(plan: ExportPlan): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = 15;

    // ===== HEADER (BRAND) =====
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(30, 144, 255);
    pdf.text("GYMini", margin, yPosition + 10);

    // Subtitle
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text("Your Personal Workout Plan", margin, yPosition + 18);

    // ===== SEPARATOR LINE =====
    yPosition += 25;
    pdf.setDrawColor(30, 144, 255);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);

    // ===== ATHLETE NAME (NEW!) =====
    yPosition += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(80, 80, 80);
    
    if (plan.userName) {
      pdf.text(`Athlete: ${plan.userName}`, margin, yPosition);
      yPosition += 6;
    }

    // ===== PLAN TITLE =====
    yPosition += 2;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    
    const titleLines = pdf.splitTextToSize(plan.title, pageWidth - margin * 2);
    pdf.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 7 + 4;

    // ===== PLAN INFO =====
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(80, 80, 80);

    const infoLines: string[] = [];
    if (plan.level) infoLines.push(`Level: ${plan.level}`);
    if (plan.goal) infoLines.push(`Goal: ${plan.goal}`);
    infoLines.push(`Generated: ${new Date().toLocaleDateString()}`);
    
    for (const line of infoLines) {
      pdf.text(line, margin, yPosition);
      yPosition += 5;
    }

    yPosition += 6;

    // ===== WORKOUT DAYS =====
    for (let dayIdx = 0; dayIdx < plan.days.length; dayIdx++) {
      const day = plan.days[dayIdx];

      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
      }

      // Day header with background
      pdf.setFillColor(230, 240, 255);
      pdf.rect(margin - 2, yPosition - 4, pageWidth - margin * 2 + 4, 8, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(30, 144, 255);
      pdf.text(day.day, margin + 2, yPosition);

      yPosition += 8;

      // Exercises
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      for (let exIdx = 0; exIdx < day.exercises.length; exIdx++) {
        const ex = day.exercises[exIdx];

        // Check if we need a new page
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = margin;
        }

        const exerciseText = `${ex.name}`;
        const setsRepsText = `${ex.sets}×${ex.reps}`;

        // Bullet point
        pdf.setTextColor(30, 144, 255);
        pdf.text("•", margin + 3, yPosition);

        // Exercise name
        pdf.setTextColor(0, 0, 0);
        const textWidth = pageWidth - margin * 2 - 35;
        const splitText = pdf.splitTextToSize(exerciseText, textWidth);

        for (let i = 0; i < splitText.length; i++) {
          if (yPosition > pageHeight - 15) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.text(splitText[i], margin + 7, yPosition);

          if (i === 0) {
            // Sets × Reps on the right, only on first line
            pdf.setTextColor(100, 100, 100);
            pdf.setFont("helvetica", "bold");
            pdf.text(setsRepsText, pageWidth - margin - 5, yPosition, {
              align: "right",
            });
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(0, 0, 0);
          }

          yPosition += 5;
        }

        yPosition += 2;
      }

      // Space between days
      yPosition += 6;

      if (dayIdx < plan.days.length - 1) {
        yPosition += 2;
      }
    }

    // ===== FOOTER =====
    const footerY = pageHeight - 10;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(180, 180, 180);
    pdf.text(
      "Powered by GYMini · Your Personal Fitness Companion",
      pageWidth / 2,
      footerY,
      { align: "center" }
    );

    // ===== SAVE PDF =====
    const fileName = `${plan.title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("PDF export error:", error);
    throw error;
  }
}

// Keep old TXT export for backward compatibility
export function exportPlanAsTxt(plan: ExportPlan): void {
  const lines: string[] = [
    "═══════════════════════════════════════",
    "        GYMini — Workout Plan",
    "═══════════════════════════════════════",
    "",
    `Plan: ${plan.title}`,
  ];

  if (plan.level) lines.push(`Level: ${plan.level}`);
  if (plan.goal) lines.push(`Goal: ${plan.goal}`);
  lines.push(`Generated: ${new Date().toLocaleDateString()}`, "");

  for (const day of plan.days) {
    lines.push(`───── ${day.day} ─────`);
    for (const ex of day.exercises) {
      lines.push(`  • ${ex.name}  ${ex.sets}×${ex.reps}`);
    }
    lines.push("");
  }

  lines.push("───────────────────────────────────────");
  lines.push("Powered by GYMini · gymini.app");

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${plan.title.replace(/\s+/g, "_")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}