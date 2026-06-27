import { LessonsService } from './lessons.service';
export declare class LessonsController {
    private readonly lessons;
    constructor(lessons: LessonsService);
    list(userId: string): Promise<{
        completed: boolean;
        locked: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        icon: string;
        category: string;
        titleEn: string;
        titleNe: string;
        active: boolean;
        order: number;
        color: string;
        descEn: string;
        descNe: string;
        xpReward: number;
        questions: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    complete(userId: string, id: string): Promise<{
        lessonId: string;
        alreadyDone: boolean;
        xpReward: number;
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            petSpecies: string | null;
            petHappiness: number;
            userId: string;
            xp: number;
            level: number;
            petStage: number;
            lessonsCompleted: number;
            streak: number;
            totalCo2Saved: number;
            lastQuestDate: string | null;
        };
    }>;
}
