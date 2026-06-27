export interface LessonOption {
    en: string;
    ne: string;
    correct?: boolean;
}
export interface LessonQuestion {
    qEn: string;
    qNe: string;
    options: LessonOption[];
    explainEn: string;
    explainNe: string;
}
export interface LessonSeed {
    order: number;
    slug: string;
    icon: string;
    color: string;
    category: string;
    titleEn: string;
    titleNe: string;
    descEn: string;
    descNe: string;
    xpReward: number;
    questions: LessonQuestion[];
}
export declare const LESSONS: LessonSeed[];
