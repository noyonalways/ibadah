'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, Sparkles, BookOpen, CheckCircle, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/shared/reveal';
import { cn } from '@/lib/utils';

interface SamplePrompt {
  id: string;
  promptKey: string;
  question: string;
  answer: string;
  sources: { title: string; ref: string; type: 'Quran' | 'Hadith' }[];
}

export function AiInteractiveSandbox() {
  const t = useTranslations();

  const SAMPLE_PROMPTS: SamplePrompt[] = [
    {
      id: 'patience',
      promptKey: 'sandbox_prompt_1',
      question: 'What Quranic verses speak about patience (Sabr) during hardship?',
      answer:
        'Allah (SWT) emphasizes patience and promises His guidance to those who preserve in faith. Surah Al-Baqarah highlights that Allah is with the patient:\n\n"O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient." (Quran 2:153)\n\nFurthermore, in Surah Ash-Sharh (94:5-6), Allah reassures: "For indeed, with hardship [will be] ease. Indeed, with hardship [will be] ease."',
      sources: [
        { title: 'Surah Al-Baqarah (2:153)', ref: 'Ayah 153 - Authentic Text', type: 'Quran' },
        { title: 'Surah Ash-Sharh (94:5-6)', ref: 'Ayahs 5-6 - Authentic Text', type: 'Quran' },
      ],
    },
    {
      id: 'tahajjud',
      promptKey: 'sandbox_prompt_2',
      question: 'Show authentic Hadiths about the virtues of Tahajjud prayer.',
      answer:
        'The Prophet Muhammad (ﷺ) described the night prayer (Tahajjud) as the honorable practice of the righteous:\n\n"Hold fast to the night prayer, for it was the custom of the righteous before you, a means of drawing near to your Lord, an expiation for sins, and a barrier against wrongdoing." (Sunan al-Tirmidhi 3549, Graded Sahih)\n\nAlso, during the last third of the night, Allah descends to the lowest heaven answering supplicants (Sahih al-Bukhari 1145).',
      sources: [
        { title: 'Sunan al-Tirmidhi 3549', ref: 'Grade: Sahih (Authentic)', type: 'Hadith' },
        { title: 'Sahih al-Bukhari 1145', ref: 'Kitab al-Tahajjud', type: 'Hadith' },
      ],
    },
    {
      id: 'dhikr',
      promptKey: 'sandbox_prompt_3',
      question: 'What is the recommended Dhikr after completing Fard Salah?',
      answer:
        'After completing obligatory Salah, it is Sunnah to recite Astaghfirullah 3 times, followed by:\n\n"Allahumma antas-Salam wa minkas-Salam, tabarakta ya Dhal-Jalali wal-Ikram"\n\nThen recite SubhanAllah (33x), Alhamdulillah (33x), and Allahu Akbar (33x), concluding with Ayat al-Kursi which earns immense reward (Sahih Muslim 591, Sunan an-Nasa\'i 9848).',
      sources: [
        { title: 'Sahih Muslim 591', ref: 'Book 5, Hadith 172', type: 'Hadith' },
        { title: 'Sunan an-Nasa\'i 9848', ref: 'Amal al-Yawm wal-Laylah', type: 'Hadith' },
      ],
    },
    {
      id: 'consistency',
      promptKey: 'sandbox_prompt_4',
      question: 'How can I maintain consistency in reading the Quran daily?',
      answer:
        'Consistency in worship is beloved to Allah even in small amounts. The Prophet (ﷺ) said: "The most beloved deeds to Allah are those done regularly, even if they are small." (Sahih al-Bukhari 6465).\n\nPractical tips:\n1. Set a fixed small goal (e.g. 1 page after Fajr or Isha).\n2. Use the Ibadah daily checklist to track habit streaks.\n3. Listen to recitation audio while reflecting on Tafsir.',
      sources: [
        { title: 'Sahih al-Bukhari 6465', ref: 'Kitab al-Riqaq', type: 'Hadith' },
        { title: 'Worship Guidance', ref: 'Habit Consistency Framework', type: 'Quran' },
      ],
    },
  ];

  const [activePrompt, setActivePrompt] = useState<SamplePrompt>(SAMPLE_PROMPTS[0]);
  const [displayedAnswer, setDisplayedAnswer] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  useEffect(() => {
    let currentIdx = 0;
    setIsTyping(true);
    setDisplayedAnswer('');

    const fullText = activePrompt.answer;
    const interval = setInterval(() => {
      if (currentIdx < fullText.length) {
        setDisplayedAnswer(fullText.slice(0, currentIdx + 12));
        currentIdx += 12;
      } else {
        setDisplayedAnswer(fullText);
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [activePrompt]);

  return (
    <section id="sandbox" className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <Reveal variant="fade-up">
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              {t('AiShowcase.sandbox_title')}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t('AiShowcase.sandbox_subtitle')}
            </p>
          </Reveal>
        </div>

        {/* Interactive Container */}
        <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-border/70 bg-card shadow-2xl overflow-hidden">
          {/* Prompt Selector Chips */}
          <div className="border-b border-border/60 bg-muted/40 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t('AiShowcase.sandbox_prompt_label')}
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((p) => {
                const isActive = activePrompt.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePrompt(p)}
                    className={cn(
                      'rounded-xl px-3.5 py-2 text-xs font-medium transition-all sm:text-sm text-left',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                        : 'bg-background hover:bg-muted/80 text-foreground border border-border/60',
                    )}
                  >
                    {p.question}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulated Chat Response Window */}
          <div className="p-5 sm:p-8 space-y-6">
            {/* User Question */}
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                You
              </div>
              <div className="rounded-2xl rounded-tl-none bg-muted/80 px-4 py-3 text-sm text-foreground">
                {activePrompt.question}
              </div>
            </div>

            {/* AI Assistant Output */}
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent-deep text-primary-foreground shadow-md">
                <Bot className="size-4" />
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Sparkles className="size-3.5" />
                    Ibadah AI Knowledge Engine
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {t('AiShowcase.sandbox_simulated_tag')}
                  </span>
                </div>

                <div className="rounded-2xl rounded-tl-none border border-border/50 bg-background/80 p-4 text-sm leading-relaxed text-foreground font-sans whitespace-pre-line shadow-inner min-h-[120px]">
                  {displayedAnswer}
                  {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />}
                </div>

                {/* Citation & Source Badges */}
                <div className="pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                    <BookOpen className="size-3.5 text-primary" />
                    {t('AiShowcase.sandbox_sources_heading')}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {activePrompt.sources.map((src, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="size-3.5 text-emerald-500 shrink-0" />
                          <span className="font-semibold text-foreground">{src.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {src.ref}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
