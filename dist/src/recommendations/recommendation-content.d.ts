export interface StudentRecSeed {
    ruleKey: string;
    triggerKey: string;
    triggerValues: string[];
    weight: number;
    co2SavedKg: number;
    icon: string;
    textEn: string;
    textNe: string;
}
export declare const STUDENT_RECS: StudentRecSeed[];
export declare const STUDENT_ALL_GREEN: {
    ruleKey: string;
    icon: string;
    co2SavedKg: number;
    textEn: string;
    textNe: string;
};
export interface SchoolRecSeed {
    ruleKey: string;
    category: string;
    icon: string;
    titleEn: string;
    titleNe: string;
    textEn: string;
    textNe: string;
}
export declare const SCHOOL_RECS: SchoolRecSeed[];
