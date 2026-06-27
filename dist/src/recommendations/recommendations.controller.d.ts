import { RecommendationsService } from './recommendations.service';
import { QuestAnswersDto, CreateRecommendationDto, UpdateRecommendationDto } from './dto/recommendation.dto';
import { RecAudience } from '@prisma/client';
export declare class RecommendationsController {
    private readonly recs;
    constructor(recs: RecommendationsService);
    forQuest(dto: QuestAnswersDto): Promise<{
        recommendations: {
            id: string;
            icon: string;
            en: string;
            ne: string;
            co2Saved: number;
        }[];
        potentialCo2Saved: number;
    }>;
    list(audience?: RecAudience): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        audience: import(".prisma/client").$Enums.RecAudience;
        ruleKey: string;
        triggerKey: string | null;
        triggerValues: string[];
        weight: number;
        co2SavedKg: number;
        icon: string;
        textEn: string;
        textNe: string;
        category: string | null;
        titleEn: string | null;
        titleNe: string | null;
        active: boolean;
    }[]>;
    create(dto: CreateRecommendationDto): import(".prisma/client").Prisma.Prisma__RecommendationClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        audience: import(".prisma/client").$Enums.RecAudience;
        ruleKey: string;
        triggerKey: string | null;
        triggerValues: string[];
        weight: number;
        co2SavedKg: number;
        icon: string;
        textEn: string;
        textNe: string;
        category: string | null;
        titleEn: string | null;
        titleNe: string | null;
        active: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, dto: UpdateRecommendationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        audience: import(".prisma/client").$Enums.RecAudience;
        ruleKey: string;
        triggerKey: string | null;
        triggerValues: string[];
        weight: number;
        co2SavedKg: number;
        icon: string;
        textEn: string;
        textNe: string;
        category: string | null;
        titleEn: string | null;
        titleNe: string | null;
        active: boolean;
    }>;
    remove(id: string): Promise<{
        deleted: boolean;
    }>;
}
