import { StudentsService } from './students.service';
import { QuestCompleteDto, UpdateProfileDto } from './dto/quest-complete.dto';
export declare class StudentsController {
    private readonly students;
    constructor(students: StudentsService);
    getProgress(userId: string): Promise<{
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
    }>;
    completeQuest(userId: string, dto: QuestCompleteDto): Promise<{
        leveledUp: boolean;
        evolved: boolean;
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
    }>;
    completeLesson(userId: string): Promise<{
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
    }>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
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
    }>;
    leaderboard(schoolId: string, scope?: string): Promise<{
        rank: number;
        userId: string;
        name: string;
        school: string;
        xp: number;
        level: number;
        streak: number;
        petStage: number;
    }[]>;
    classStandings(userId: string): Promise<{
        className: string;
        ranking: {
            rank: number;
            studentId: string;
            name: string;
            rollNo: string;
            xp: number;
            level: number;
            petStage: number;
            streak: number;
            isMe: boolean;
        }[];
        isHero: boolean;
    }>;
    schoolStandings(userId: string): Promise<{
        ranking: {
            rank: number;
            studentId: string;
            name: string;
            className: string;
            rollNo: string;
            xp: number;
            level: number;
            petStage: number;
            streak: number;
            isMe: boolean;
        }[];
    }>;
}
