import { RecAudience } from '@prisma/client';
export declare class QuestAnswersDto {
    answers: Record<string, string>;
}
export declare class CreateRecommendationDto {
    audience: RecAudience;
    ruleKey: string;
    category?: string;
    triggerKey?: string;
    triggerValues?: string[];
    icon?: string;
    titleEn?: string;
    titleNe?: string;
    textEn: string;
    textNe: string;
    weight?: number;
    co2SavedKg?: number;
    active?: boolean;
}
export declare class UpdateRecommendationDto {
    category?: string;
    triggerKey?: string;
    triggerValues?: string[];
    icon?: string;
    titleEn?: string;
    titleNe?: string;
    textEn?: string;
    textNe?: string;
    weight?: number;
    co2SavedKg?: number;
    active?: boolean;
}
