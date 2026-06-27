import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudentsService } from '../students/students.service';
import { Prisma } from '@prisma/client';
export declare class LessonsService implements OnModuleInit {
    private readonly prisma;
    private readonly students;
    private readonly logger;
    constructor(prisma: PrismaService, students: StudentsService);
    onModuleInit(): Promise<void>;
    seedIfEmpty(): Promise<void>;
    listForUser(userId: string): Promise<{
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
        questions: Prisma.JsonValue;
    }[]>;
    complete(userId: string, lessonId: string): Promise<{
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
