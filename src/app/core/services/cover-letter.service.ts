import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import type { SiteConfig } from '../models';
import type { Skill } from '../models';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'this', 'that', 'these', 'those', 'it', 'its', 'we', 'our', 'you', 'your',
]);

const MATCH_THRESHOLD = 0.3;

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  extractedKeywords: string[];
  isBelowThreshold: boolean;
}

@Injectable({ providedIn: 'root' })
export class CoverLetterService {
  extractKeywords(text: string): string[] {
    if (!text?.trim()) return [];
    const words = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
    return [...new Set(words)];
  }

  getMatchScore(
    jobTitle: string,
    jobDescription: string,
    skills: Skill[]
  ): MatchResult {
    const combined = `${jobTitle} ${jobDescription}`.toLowerCase();
    const keywords = this.extractKeywords(combined);

    const matchedSkills: string[] = [];
    for (const skill of skills) {
      const skillLower = skill.name.toLowerCase();
      const skillWords = skillLower.split(/\s+/);
      const matches = keywords.some(
        (kw) =>
          skillLower.includes(kw) ||
          skillWords.some((sw) => sw.includes(kw) || kw.includes(sw))
      );
      if (matches && !matchedSkills.includes(skill.name)) {
        matchedSkills.push(skill.name);
      }
    }

    const score =
      keywords.length > 0 ? matchedSkills.length / Math.min(keywords.length, 15) : 0;
    return {
      score: Math.min(score, 1),
      matchedSkills,
      extractedKeywords: keywords.slice(0, 20),
      isBelowThreshold: score < MATCH_THRESHOLD,
    };
  }

  generateBasicPdf(siteConfig: SiteConfig): void {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;
    const lineHeight = 7;

    const addText = (text: string, fontSize = 11) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight;
    };

    doc.setFont('helvetica', 'bold');
    addText(siteConfig.name, 14);
    doc.setFont('helvetica', 'normal');
    addText(siteConfig.title, 11);
    y += lineHeight;

    addText(
      siteConfig.positioningStatement,
      10
    );
    y += lineHeight;

    addText(
      siteConfig.strategicSummary ?? '',
      10
    );
    y += lineHeight * 2;

    addText(
      'I am writing to express my interest in the opportunity. With over 15 years of experience in technology leadership, infrastructure modernization, and cross-functional team management, I bring a track record of delivering resilient systems and aligning technology with business outcomes.',
      10
    );
    y += lineHeight * 2;

    addText(
      'I would welcome the opportunity to discuss how my background can contribute to your organization.',
      10
    );

    doc.save(`Cover_Letter_${siteConfig.name.replace(/\s+/g, '_')}.pdf`);
  }

  generateAdvancedPdf(
    siteConfig: SiteConfig,
    jobTitle: string,
    jobDescription: string
  ): void {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;
    const lineHeight = 7;

    const addText = (text: string, fontSize = 11) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight;
    };

    doc.setFont('helvetica', 'bold');
    addText(siteConfig.name, 14);
    doc.setFont('helvetica', 'normal');
    addText(siteConfig.title, 11);
    y += lineHeight;

    addText(`Re: ${jobTitle}`, 10);
    y += lineHeight * 2;

    addText(siteConfig.positioningStatement, 10);
    y += lineHeight;

    addText(
      siteConfig.strategicSummary ?? '',
      10
    );
    y += lineHeight * 2;

    const intro = `I am writing to express my interest in the ${jobTitle} position. ${siteConfig.strategicSummary ?? ''} I believe my experience in enterprise infrastructure, cloud architecture, and technology transformation aligns well with the role requirements.`;
    addText(intro, 10);
    y += lineHeight * 2;

    addText(
      'I would welcome the opportunity to discuss how my background can contribute to your organization.',
      10
    );

    doc.save(`Cover_Letter_${jobTitle.replace(/\s+/g, '_')}.pdf`);
  }
}
