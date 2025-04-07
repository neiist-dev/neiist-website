export interface Election {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
}

export interface ElectionWithOptions extends Election {
    options: OptionWithVotes[];
}

export interface CreateElectionDto {
    name: string;
    startDate: Date;
    endDate: Date;
    options: string[];
}

export interface Option {
    id: number;
    name: string;
    electionId: number;
}

export interface OptionWithVotes extends Option {
    votes: number;
}

export interface Vote {
    username: string;
    electionId: number;
    optionId: number;
}