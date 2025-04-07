export interface Thesis {
    id: number;
    title: string;
    supervisors: string[];
    vacancies: number;
    location: string;
    observations: string;
    objectives: string;
    requirements: string;
    area1: string;
    area2: string;
}

export interface ThesisWithAreas extends Omit<Thesis, 'area1' | 'area2'> {
    areas: string[];
}